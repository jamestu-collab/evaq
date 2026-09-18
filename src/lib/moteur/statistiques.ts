import { PLAFOND_WEEKEND_DEFAUT, PREFERENCE_QUARTS_CONSECUTIFS } from "@/lib/constants";
import { cleMois, estWeekend } from "./dates";
import { plafondEffectif, type ContexteGeneration } from "./donnees";
import type { ModeleConstruit } from "./modele";

export type StatistiqueMedecin = {
  medecinId: string;
  nom: string;
  gardesAssignees: number;
  moisAvecMinimumNonAtteint: string[];
  proportionWeekend: number;
  plafondWeekend: number;
  quartsWeekendAssignes: number;
  quartsWeekendDesireProrata: number | null;
  maxQuartsConsecutifsAtteint: number;
  maxQuartsConsecutifsCible: number | null;
  reglesAssouplies: string[];
};

export function calculerStatistiques(
  ctx: ContexteGeneration,
  modele: ModeleConstruit,
  assignationFinale: Map<number, string | null>,
): StatistiqueMedecin[] {
  const moisPresents = new Map<string, Date>();
  modele.slots.forEach((s) => {
    const cm = cleMois(s.date);
    if (!moisPresents.has(cm)) moisPresents.set(cm, s.date);
  });
  const nbWeekendPeriode = modele.slots.filter((s) => estWeekend(s.date)).length;

  return modele.doctors.map((m) => {
    const assigne = modele.slots.map((_, j) => assignationFinale.get(j) === m.id);
    const gardesAssignees = assigne.filter(Boolean).length;

    const compteParMois = new Map<string, number>();
    modele.slots.forEach((s, j) => {
      if (!assigne[j]) return;
      const cm = cleMois(s.date);
      compteParMois.set(cm, (compteParMois.get(cm) ?? 0) + 1);
    });
    const moisAvecMinimumNonAtteint: string[] = [];
    for (const [cm, dateRef] of moisPresents) {
      const min = plafondEffectif(m, "MIN_MOIS", dateRef);
      if ((compteParMois.get(cm) ?? 0) < min) moisAvecMinimumNonAtteint.push(cm);
    }

    const quartsWeekendAssignes = modele.slots.filter((s, j) => assigne[j] && estWeekend(s.date)).length;
    const proportionWeekend = gardesAssignees > 0 ? quartsWeekendAssignes / gardesAssignees : 0;
    const quartsWeekendDesireProrata =
      m.nbQuartsWeekendDesire != null ? m.nbQuartsWeekendDesire * (nbWeekendPeriode / 52) : null;

    let plusLongueSerie = 0;
    let serieCourante = 0;
    for (const a of assigne) {
      serieCourante = a ? serieCourante + 1 : 0;
      plusLongueSerie = Math.max(plusLongueSerie, serieCourante);
    }

    const maxQuartsConsecutifsCible =
      m.preferenceQuartsConsecutifs === PREFERENCE_QUARTS_CONSECUTIFS.NON
        ? 1
        : m.preferenceQuartsConsecutifs === PREFERENCE_QUARTS_CONSECUTIFS.OUI
          ? (m.maxQuartsConsecutifs ?? 4)
          : null;

    const reglesAssouplies: string[] = [];
    if (moisAvecMinimumNonAtteint.length > 0) {
      reglesAssouplies.push(
        `Minimum mensuel non atteint (${moisAvecMinimumNonAtteint.length} mois sur ${moisPresents.size})`,
      );
    }
    if (proportionWeekend > PLAFOND_WEEKEND_DEFAUT + 0.01) {
      reglesAssouplies.push(
        `Plafond de fins de semaine dépassé (${Math.round(proportionWeekend * 100)} % vs ${Math.round(PLAFOND_WEEKEND_DEFAUT * 100)} % visé)`,
      );
    }
    if (quartsWeekendDesireProrata != null && Math.abs(quartsWeekendAssignes - quartsWeekendDesireProrata) > 0.5) {
      reglesAssouplies.push(
        `Écart avec le nombre de fins de semaine désiré (${quartsWeekendAssignes} vs ${quartsWeekendDesireProrata.toFixed(1)} souhaité pour cette période)`,
      );
    }
    if (maxQuartsConsecutifsCible != null && plusLongueSerie > maxQuartsConsecutifsCible) {
      reglesAssouplies.push(
        `Préférence de quarts consécutifs dépassée (${plusLongueSerie} d'affilée vs ${maxQuartsConsecutifsCible} souhaité)`,
      );
    }

    return {
      medecinId: m.id,
      nom: m.nom,
      gardesAssignees,
      moisAvecMinimumNonAtteint,
      proportionWeekend,
      plafondWeekend: PLAFOND_WEEKEND_DEFAUT,
      quartsWeekendAssignes,
      quartsWeekendDesireProrata,
      maxQuartsConsecutifsAtteint: plusLongueSerie,
      maxQuartsConsecutifsCible,
      reglesAssouplies,
    };
  });
}
