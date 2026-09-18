import {
  MAX_QUARTS_CONSECUTIFS_PLAFOND,
  PLAFOND_WEEKEND_DEFAUT,
  PREFERENCE_QUARTS_CONSECUTIFS,
} from "@/lib/constants";
import { ModeleLP, terme } from "./lp";
import { calculerPoids, poidsPourMedecin } from "./poids";
import { cleMois, cleSemaineISO, enumererDates, estWeekend, toISODate } from "./dates";
import { estIndisponible, plafondEffectif, type ContexteGeneration } from "./donnees";

export type Slot = { date: Date; dateStr: string };

export type ModeleConstruit = {
  lp: ModeleLP;
  slots: Slot[];
  doctors: ContexteGeneration["medecins"];
  varsParMedecinSlot: (string | null)[][];
  assignationsFixees: Map<number, string>; // slotIndex -> medecinId
};

// Nom de variable valide en format LP a partir d'indices numeriques (les
// identifiants cuid des medecins contiennent des caracteres non permis).
const nomVar = (i: number, j: number) => `x_${i}_${j}`;

// Le format LP n'accepte pas le tiret dans un identifiant (il serait lu
// comme un signe moins) : on l'assainit pour les cles derivees de dates
// (ex. "2026-10" -> "2026_10").
const idSur = (s: string) => s.replace(/[^A-Za-z0-9_]/g, "_");

export function construireModele(ctx: ContexteGeneration): ModeleConstruit {
  const slots: Slot[] = enumererDates(ctx.dateDebut, ctx.dateFin).map((date) => ({
    date,
    dateStr: toISODate(date),
  }));
  const doctors = ctx.medecins;
  const lp = new ModeleLP();

  const existantesParDate = new Map(ctx.assignationsExistantes.map((a) => [toISODate(a.date), a]));
  const autreBaseParCle = new Set(
    ctx.assignationsAutreBase.map((a) => `${toISODate(a.date)}:${a.medecinId}`),
  );

  const assignationsFixees = new Map<number, string>();
  const slotsLibres: number[] = [];
  slots.forEach((s, j) => {
    const existante = existantesParDate.get(s.dateStr);
    if (existante?.verrouille) {
      assignationsFixees.set(j, existante.medecinId);
    } else {
      slotsLibres.push(j);
    }
  });

  // varsParMedecinSlot[i][j] = nom de variable si une assignation medecin i /
  // slot j est possible, sinon null (creneau fixe, medecin indisponible, ou
  // deja affecte a l'autre base ce jour-la).
  const varsParMedecinSlot: (string | null)[][] = doctors.map(() => new Array(slots.length).fill(null));
  const varsParSlot: string[][] = slots.map(() => []);

  doctors.forEach((m, i) => {
    slotsLibres.forEach((j) => {
      const s = slots[j];
      if (estIndisponible(ctx, m.id, s.date)) return;
      if (autreBaseParCle.has(`${s.dateStr}:${m.id}`)) return;
      const v = nomVar(i, j);
      lp.declarerBinaire(v);
      varsParMedecinSlot[i][j] = v;
      varsParSlot[j].push(v);
    });
  });

  // --- Contrainte : au plus un medecin par quart (creneaux libres seulement,
  // les creneaux fixes sont deja regles) ---
  slotsLibres.forEach((j) => {
    if (varsParSlot[j].length === 0) return;
    lp.ajouterContrainte(
      varsParSlot[j].map((v) => terme(v)),
      "<=",
      1,
      `slot_${j}`,
    );
  });

  const poidsRegles = calculerPoids(ctx.reglesPriorite);
  const reglesParCle = Object.fromEntries(ctx.reglesPriorite.map((r) => [r.cle, r]));

  // --- Objectif : couverture (minimiser les quarts non combles) ---
  const regleCouverture = reglesParCle["COUVERTURE"];
  if (regleCouverture) {
    slotsLibres.forEach((j) => {
      varsParSlot[j].forEach((v) => {
        // Le poids de couverture n'est pas module par medecin : c'est une
        // priorite globale, pas une regle individuelle.
        lp.ajouterAuxObjectif(v, -poidsRegles.COUVERTURE);
      });
    });
  }

  // --- Contraintes hebdomadaires / mensuelles / semestrielles (max = dur,
  // min = souple) ---
  doctors.forEach((m, i) => {
    const parSemaine = new Map<string, number[]>();
    const parMois = new Map<string, number[]>();
    slots.forEach((s, j) => {
      if (varsParMedecinSlot[i][j] === null) return;
      const cs = cleSemaineISO(s.date);
      const cm = cleMois(s.date);
      (parSemaine.get(cs) ?? parSemaine.set(cs, []).get(cs)!).push(j);
      (parMois.get(cm) ?? parMois.set(cm, []).get(cm)!).push(j);
    });

    // Semaine : max dur
    for (const [cs, indicesLibres] of parSemaine) {
      const dateRef = new Date(indicesLibres[0] !== undefined ? slots[indicesLibres[0]].date : ctx.dateDebut);
      const fixeCount = slots.filter(
        (s, j) => cleSemaineISO(s.date) === cs && assignationsFixees.get(j) === m.id,
      ).length;
      const max = plafondEffectif(m, "MAX_SEMAINE", dateRef);
      const vars = indicesLibres.map((j) => terme(varsParMedecinSlot[i][j]!));
      const rhs = max - fixeCount;
      if (rhs < 0) {
        vars.forEach(({ variable }) => lp.ajouterContrainte([terme(variable)], "<=", 0));
      } else if (vars.length > 0) {
        lp.ajouterContrainte(vars, "<=", rhs, `max_sem_${i}_${idSur(cs)}`);
      }
    }

    // Mois : max dur, min souple
    const regleMin = reglesParCle["MIN_GARDES"];
    for (const [cm, indicesLibres] of parMois) {
      const dateRef = new Date(indicesLibres[0] !== undefined ? slots[indicesLibres[0]].date : ctx.dateDebut);
      const fixeCount = slots.filter(
        (s, j) => cleMois(s.date) === cm && assignationsFixees.get(j) === m.id,
      ).length;
      const vars = indicesLibres.map((j) => terme(varsParMedecinSlot[i][j]!));

      const max = plafondEffectif(m, "MAX_MOIS", dateRef);
      const rhsMax = max - fixeCount;
      if (rhsMax < 0) {
        vars.forEach(({ variable }) => lp.ajouterContrainte([terme(variable)], "<=", 0));
      } else if (vars.length > 0) {
        lp.ajouterContrainte(vars, "<=", rhsMax, `max_mois_${i}_${idSur(cm)}`);
      }

      if (regleMin && vars.length > 0) {
        const min = plafondEffectif(m, "MIN_MOIS", dateRef);
        const rhsMin = min - fixeCount;
        if (rhsMin > 0) {
          const manque = `manque_${i}_${idSur(cm)}`;
          lp.ajouterContrainte(
            [...vars, terme(manque, 1)],
            ">=",
            rhsMin,
            `min_mois_${i}_${idSur(cm)}`,
          );
          lp.ajouterAuxObjectif(manque, poidsPourMedecin(poidsRegles.MIN_GARDES, regleMin, m.id));
        }
      }
    }

    // Semestre (periode complete demandee) : max dur, min souple
    if (m.maxGardesSemestre != null || m.minGardesSemestre != null) {
      const tousLibres = slots.map((_, j) => j).filter((j) => varsParMedecinSlot[i][j] !== null);
      const fixeCountTotal = slots.filter((_, j) => assignationsFixees.get(j) === m.id).length;
      const vars = tousLibres.map((j) => terme(varsParMedecinSlot[i][j]!));

      if (m.maxGardesSemestre != null) {
        const max = plafondEffectif(m, "MAX_SEMESTRE", ctx.dateDebut);
        const rhs = max - fixeCountTotal;
        if (Number.isFinite(rhs) && vars.length > 0) {
          if (rhs < 0) vars.forEach(({ variable }) => lp.ajouterContrainte([terme(variable)], "<=", 0));
          else lp.ajouterContrainte(vars, "<=", rhs, `max_sem_periode_${i}`);
        }
      }
      if (m.minGardesSemestre != null && regleMin && vars.length > 0) {
        const min = plafondEffectif(m, "MIN_SEMESTRE", ctx.dateDebut);
        const rhs = min - fixeCountTotal;
        if (rhs > 0) {
          const manque = `manque_sem_periode_${i}`;
          lp.ajouterContrainte([...vars, terme(manque, 1)], ">=", rhs, `min_sem_periode_${i}`);
          lp.ajouterAuxObjectif(manque, poidsPourMedecin(poidsRegles.MIN_GARDES, regleMin, m.id));
        }
      }
    }
  });

  // --- Quarts consecutifs ---
  const regleConsecutifs = reglesParCle["QUARTS_CONSECUTIFS"];
  doctors.forEach((m, i) => {
    const pref = m.preferenceQuartsConsecutifs;
    if (pref === PREFERENCE_QUARTS_CONSECUTIFS.PEU_IMPORTE) return;

    const cap = pref === PREFERENCE_QUARTS_CONSECUTIFS.NON ? 1 : m.maxQuartsConsecutifs ?? MAX_QUARTS_CONSECUTIFS_PLAFOND;
    const tailleFenetre = cap + 1;
    const dur = m.resideHorsQuebec;
    if (!dur && !regleConsecutifs) return;

    for (let debut = 0; debut + tailleFenetre <= slots.length; debut++) {
      const indicesFenetre = Array.from({ length: tailleFenetre }, (_, k) => debut + k);
      const varsLibres = indicesFenetre
        .map((j) => varsParMedecinSlot[i][j])
        .filter((v): v is string => v !== null);
      const fixeCount = indicesFenetre.filter((j) => assignationsFixees.get(j) === m.id).length;
      if (varsLibres.length === 0) continue;
      const rhs = cap - fixeCount;

      if (dur) {
        if (rhs < 0) varsLibres.forEach((v) => lp.ajouterContrainte([terme(v)], "<=", 0));
        else lp.ajouterContrainte(varsLibres.map((v) => terme(v)), "<=", rhs, `consec_${i}_${debut}`);
      } else if (regleConsecutifs) {
        const slack = `depasse_consec_${i}_${debut}`;
        lp.ajouterContrainte(
          [...varsLibres.map((v) => terme(v)), terme(slack, -1)],
          "<=",
          rhs,
          `consec_souple_${i}_${debut}`,
        );
        lp.ajouterAuxObjectif(slack, poidsPourMedecin(poidsRegles.QUARTS_CONSECUTIFS, regleConsecutifs, m.id));
      }
    }
  });

  // --- Plafond de fins de semaine (souple) et quarts de weekend desires (souple) ---
  const regleProportion = reglesParCle["PROPORTION_WEEKEND"];
  const regleDesire = reglesParCle["QUARTS_WEEKEND_DESIRE"];
  const nbWeekendPeriode = slots.filter((s) => estWeekend(s.date)).length;

  doctors.forEach((m, i) => {
    const tousLibres = slots.map((_, j) => j).filter((j) => varsParMedecinSlot[i][j] !== null);
    if (tousLibres.length === 0 && !assignationsFixees.size) return;

    const fixeWeekendCount = slots.filter(
      (s, j) => estWeekend(s.date) && assignationsFixees.get(j) === m.id,
    ).length;
    const fixeTotalCount = slots.filter((_, j) => assignationsFixees.get(j) === m.id).length;

    if (regleProportion) {
      const plafond = PLAFOND_WEEKEND_DEFAUT;
      const excesVar = `exces_weekend_${i}`;
      const termes = tousLibres.map((j) => {
        const v = varsParMedecinSlot[i][j]!;
        const coeff = estWeekend(slots[j].date) ? 1 - plafond : -plafond;
        return terme(v, coeff);
      });
      termes.push(terme(excesVar, -1));
      const rhs = plafond * fixeTotalCount - fixeWeekendCount;
      if (termes.length > 1) {
        lp.ajouterContrainte(termes, "<=", rhs, `weekend_plafond_${i}`);
        lp.ajouterAuxObjectif(
          excesVar,
          poidsPourMedecin(poidsRegles.PROPORTION_WEEKEND, regleProportion, m.id),
        );
      }
    }

    if (regleDesire && m.nbQuartsWeekendDesire != null && nbWeekendPeriode > 0) {
      const desireProrata = m.nbQuartsWeekendDesire * (nbWeekendPeriode / 52);
      const ecartVar = `ecart_weekend_${i}`;
      const varsWeekendLibres = tousLibres.filter((j) => estWeekend(slots[j].date));
      const cible = desireProrata - fixeWeekendCount;

      const termesA = varsWeekendLibres.map((j) => terme(varsParMedecinSlot[i][j]!));
      lp.ajouterContrainte([...termesA, terme(ecartVar, -1)], "<=", cible, `weekend_desire_haut_${i}`);
      lp.ajouterContrainte(
        [...termesA.map((t) => terme(t.variable, -1)), terme(ecartVar, -1)],
        "<=",
        -cible,
        `weekend_desire_bas_${i}`,
      );
      lp.ajouterAuxObjectif(ecartVar, poidsPourMedecin(poidsRegles.QUARTS_WEEKEND_DESIRE, regleDesire, m.id));
    }
  });

  return { lp, slots, doctors, varsParMedecinSlot, assignationsFixees };
}
