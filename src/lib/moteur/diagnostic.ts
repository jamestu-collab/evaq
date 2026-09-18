import { cleMois, cleSemaineISO } from "./dates";
import { estIndisponible, plafondEffectif, type ContexteGeneration } from "./donnees";
import type { ModeleConstruit } from "./modele";
import type { RaisonBlocage } from "./raisonsBlocage";

export type { RaisonBlocage } from "./raisonsBlocage";

export type CompteursFinaux = {
  parMedecinSemaine: Map<string, number>;
  parMedecinMois: Map<string, number>;
};

export function calculerCompteursFinaux(
  modele: ModeleConstruit,
  assignationFinale: Map<number, string | null>,
): CompteursFinaux {
  const parMedecinSemaine = new Map<string, number>();
  const parMedecinMois = new Map<string, number>();

  modele.slots.forEach((slot, j) => {
    const medecinId = assignationFinale.get(j);
    if (!medecinId) return;
    const cs = `${medecinId}:${cleSemaineISO(slot.date)}`;
    const cm = `${medecinId}:${cleMois(slot.date)}`;
    parMedecinSemaine.set(cs, (parMedecinSemaine.get(cs) ?? 0) + 1);
    parMedecinMois.set(cm, (parMedecinMois.get(cm) ?? 0) + 1);
  });

  return { parMedecinSemaine, parMedecinMois };
}

export function diagnostiquerQuartNonComble(
  ctx: ContexteGeneration,
  modele: ModeleConstruit,
  slotIndex: number,
  compteurs: CompteursFinaux,
): { medecinId: string; nom: string; raison: RaisonBlocage }[] {
  const slot = modele.slots[slotIndex];
  const resultats: { medecinId: string; nom: string; raison: RaisonBlocage }[] = [];

  modele.doctors.forEach((m, i) => {
    const v = modele.varsParMedecinSlot[i][slotIndex];
    if (v === null) {
      const raison: RaisonBlocage = estIndisponible(ctx, m.id, slot.date)
        ? "INDISPONIBLE"
        : "AUTRE_BASE";
      resultats.push({ medecinId: m.id, nom: m.nom, raison });
      return;
    }

    const cs = `${m.id}:${cleSemaineISO(slot.date)}`;
    const cm = `${m.id}:${cleMois(slot.date)}`;
    const compteSemaine = compteurs.parMedecinSemaine.get(cs) ?? 0;
    const compteMois = compteurs.parMedecinMois.get(cm) ?? 0;
    const maxSemaine = plafondEffectif(m, "MAX_SEMAINE", slot.date);
    const maxMois = plafondEffectif(m, "MAX_MOIS", slot.date);

    let raison: RaisonBlocage = "AUCUNE_RAISON_IDENTIFIEE";
    if (compteSemaine >= maxSemaine) raison = "MAX_SEMAINE";
    else if (compteMois >= maxMois) raison = "MAX_MOIS";

    resultats.push({ medecinId: m.id, nom: m.nom, raison });
  });

  return resultats;
}

export function resumerRaisons(
  resultats: { raison: RaisonBlocage }[],
): { raison: RaisonBlocage; nombre: number }[] {
  const compte = new Map<RaisonBlocage, number>();
  for (const r of resultats) compte.set(r.raison, (compte.get(r.raison) ?? 0) + 1);
  return [...compte.entries()]
    .map(([raison, nombre]) => ({ raison, nombre }))
    .sort((a, b) => b.nombre - a.nombre);
}
