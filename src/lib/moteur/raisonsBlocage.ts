// Fichier volontairement sans dependance vers Prisma ou le reste du moteur :
// il est importe a la fois cote serveur (diagnostic.ts) et cote client
// (affichage du rapport de generation), et ne doit donc jamais entrainer le
// client Prisma / better-sqlite3 dans le bundle du navigateur.

export type RaisonBlocage =
  | "INDISPONIBLE"
  | "AUTRE_BASE"
  | "MAX_SEMAINE"
  | "MAX_MOIS"
  | "AUCUNE_RAISON_IDENTIFIEE";

export const RAISON_BLOCAGE_LABELS: Record<RaisonBlocage, string> = {
  INDISPONIBLE: "indisponible ce jour",
  AUTRE_BASE: "déjà affecté à l'autre base ce jour",
  MAX_SEMAINE: "maximum hebdomadaire déjà atteint",
  MAX_MOIS: "maximum mensuel déjà atteint",
  AUCUNE_RAISON_IDENTIFIEE: "aucune contrainte dure identifiée (à revoir manuellement)",
};
