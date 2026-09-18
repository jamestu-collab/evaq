import { CLES_REGLES_PRIORITE, type CleReglePriorite } from "@/lib/constants";

type ReglePrioriteRow = {
  cle: string;
  ordre: number;
  actif: boolean;
  exceptionGenerale: boolean;
  medecinsExceptionId: unknown;
};

// Poids relatifs derives de l'ordre des regles : chaque rang vaut 1000 fois
// le rang suivant, pour qu'une regle plus prioritaire domine toujours la
// somme de toutes les violations possibles des regles moins prioritaires,
// dans les volumes attendus pour cette application (quelques dizaines de
// medecins, quelques centaines de quarts par periode generee).
export function calculerPoids(regles: ReglePrioriteRow[]): Record<CleReglePriorite, number> {
  const actives = [...regles].filter((r) => r.actif).sort((a, b) => a.ordre - b.ordre);
  const poids = {} as Record<CleReglePriorite, number>;
  actives.forEach((r, idx) => {
    poids[r.cle as CleReglePriorite] = 1000 ** (actives.length - 1 - idx);
  });
  for (const cle of CLES_REGLES_PRIORITE) {
    if (!(cle in poids)) poids[cle] = 0;
  }
  return poids;
}

function exceptionsMedecins(regle: ReglePrioriteRow): Set<string> {
  try {
    const liste = regle.medecinsExceptionId;
    if (Array.isArray(liste)) return new Set(liste as string[]);
    if (typeof liste === "string") return new Set(JSON.parse(liste));
  } catch {
    // valeur invalide, aucune exception
  }
  return new Set();
}

// Poids applique pour un medecin precis, en tenant compte d'une exception
// (generale ou ciblee) configuree sur la regle : le poids n'est pas ramene a
// zero mais fortement reduit, pour que le moteur repartisse naturellement
// l'assouplissement plutot que de toujours le concentrer sur les memes
// medecins des qu'une autre solution equivalente existe.
export function poidsPourMedecin(
  poidsBase: number,
  regle: ReglePrioriteRow,
  medecinId: string,
): number {
  if (!regle.actif || poidsBase === 0) return 0;
  if (regle.exceptionGenerale) return poidsBase * 0.05;
  if (exceptionsMedecins(regle).has(medecinId)) return poidsBase * 0.05;
  return poidsBase;
}
