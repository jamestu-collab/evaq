import loadHighs from "highs";
import { prisma } from "@/lib/prisma";
import { STATUT_ASSIGNATION, type Base } from "@/lib/constants";
import { chargerContexteGeneration } from "./donnees";
import { construireModele, type ModeleConstruit } from "./modele";
import {
  calculerCompteursFinaux,
  diagnostiquerQuartNonComble,
  resumerRaisons,
  type RaisonBlocage,
} from "./diagnostic";
import { calculerStatistiques, type StatistiqueMedecin } from "./statistiques";

export type QuartNonComble = {
  date: string;
  raisons: { raison: RaisonBlocage; nombre: number }[];
};

export type RapportGeneration = {
  base: Base;
  dateDebut: string;
  dateFin: string;
  statutSolveur: string;
  nbQuartsTotal: number;
  nbQuartsCombles: number;
  quartsNonCombles: QuartNonComble[];
  statistiques: StatistiqueMedecin[];
};

const STATUTS_SOLUTION_UTILISABLE = new Set([
  "Optimal",
  "Time limit reached",
  "Iteration limit reached",
]);

export async function genererHoraire(
  base: Base,
  dateDebut: Date,
  dateFin: Date,
): Promise<RapportGeneration> {
  if (dateDebut > dateFin) {
    throw new Error("La date de début doit précéder la date de fin.");
  }

  const ctx = await chargerContexteGeneration(base, dateDebut, dateFin);
  const modele: ModeleConstruit = construireModele(ctx);
  const lpText = modele.lp.construire();

  const highs = await loadHighs();
  const resultat = highs.solve(lpText, {
    output_flag: false,
    time_limit: 60,
    mip_rel_gap: 0.005,
  });

  if (!STATUTS_SOLUTION_UTILISABLE.has(resultat.Status)) {
    throw new Error(
      `Le solveur n'a pas trouvé de solution utilisable (statut : ${resultat.Status}).`,
    );
  }

  // Reconstruction de l'affectation finale : creneaux fixes + solution du solveur.
  const assignationFinale = new Map<number, string | null>();
  modele.slots.forEach((_, j) => {
    const fixe = modele.assignationsFixees.get(j);
    if (fixe) {
      assignationFinale.set(j, fixe);
      return;
    }
    let trouve: string | null = null;
    modele.doctors.forEach((m, i) => {
      const v = modele.varsParMedecinSlot[i][j];
      if (!v) return;
      const colonne = resultat.Columns[v] as { Primal?: number } | undefined;
      const valeur = colonne?.Primal ?? 0;
      if (valeur > 0.5) trouve = m.id;
    });
    assignationFinale.set(j, trouve);
  });

  // Persistance : on remplace les assignations generees precedemment sur
  // cette periode (les assignations verrouillees, elles, ne sont jamais
  // touchees puisqu'elles n'ont pas de variable et restent telles quelles).
  await prisma.$transaction(async (tx) => {
    await tx.assignation.deleteMany({
      where: { base, date: { gte: dateDebut, lte: dateFin }, verrouille: false },
    });

    const nouvelles = modele.slots
      .map((slot, j) => ({ slot, j, medecinId: assignationFinale.get(j) }))
      .filter(
        (x): x is { slot: (typeof modele.slots)[number]; j: number; medecinId: string } =>
          !!x.medecinId && !modele.assignationsFixees.has(x.j),
      );

    if (nouvelles.length > 0) {
      await tx.assignation.createMany({
        data: nouvelles.map(({ slot, medecinId }) => ({
          base,
          date: slot.date,
          typeQuartId: ctx.typeQuart.id,
          medecinId,
          statut: STATUT_ASSIGNATION.GENERE,
          verrouille: false,
        })),
      });
    }
  });

  const compteurs = calculerCompteursFinaux(modele, assignationFinale);
  const quartsNonCombles: QuartNonComble[] = [];
  modele.slots.forEach((slot, j) => {
    if (assignationFinale.get(j)) return;
    const diag = diagnostiquerQuartNonComble(ctx, modele, j, compteurs);
    quartsNonCombles.push({ date: slot.dateStr, raisons: resumerRaisons(diag) });
  });

  const statistiques = calculerStatistiques(ctx, modele, assignationFinale);
  const nbQuartsCombles = modele.slots.length - quartsNonCombles.length;

  return {
    base,
    dateDebut: modele.slots[0]?.dateStr ?? "",
    dateFin: modele.slots[modele.slots.length - 1]?.dateStr ?? "",
    statutSolveur: resultat.Status,
    nbQuartsTotal: modele.slots.length,
    nbQuartsCombles,
    quartsNonCombles,
    statistiques,
  };
}
