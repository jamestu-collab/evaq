export const STATUT_MDS = {
  MDS_EXISTANT: "MDS_EXISTANT",
  NON_MDS: "NON_MDS",
} as const;
export type StatutMds = (typeof STATUT_MDS)[keyof typeof STATUT_MDS];

export const STATUT_MDS_LABELS: Record<StatutMds, string> = {
  MDS_EXISTANT: "Membre MDS existant",
  NON_MDS: "Non-MDS",
};

export const PREFERENCE_QUARTS_CONSECUTIFS = {
  OUI: "OUI",
  NON: "NON",
  PEU_IMPORTE: "PEU_IMPORTE",
} as const;
export type PreferenceQuartsConsecutifs =
  (typeof PREFERENCE_QUARTS_CONSECUTIFS)[keyof typeof PREFERENCE_QUARTS_CONSECUTIFS];

export const PREFERENCE_QUARTS_CONSECUTIFS_LABELS: Record<
  PreferenceQuartsConsecutifs,
  string
> = {
  OUI: "Oui",
  NON: "Non",
  PEU_IMPORTE: "Peu importe",
};

// Minimum de gardes/mois par defaut selon le statut, si aucune valeur
// n'est saisie explicitement sur le profil (cahier des charges, section
// "Profils medecins").
export const MIN_GARDES_MOIS_DEFAUT: Record<StatutMds, number> = {
  MDS_EXISTANT: 3,
  NON_MDS: 4,
};

export const MAX_GARDES_SEMAINE_DEFAUT = 4;
export const MAX_GARDES_MOIS_DEFAUT = 8;
export const MAX_QUARTS_CONSECUTIFS_PLAFOND = 4;

export const STATUT_FORMULAIRE = {
  EN_ATTENTE: "EN_ATTENTE",
  VALIDE: "VALIDE",
  REJETE: "REJETE",
  ERREUR: "ERREUR",
} as const;
export type StatutFormulaire =
  (typeof STATUT_FORMULAIRE)[keyof typeof STATUT_FORMULAIRE];

export const STATUT_FORMULAIRE_LABELS: Record<StatutFormulaire, string> = {
  EN_ATTENTE: "En attente de validation",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  ERREUR: "Erreur d'extraction",
};

export const TYPE_DEROGATION = {
  MIN_MOIS: "MIN_MOIS",
  MAX_SEMAINE: "MAX_SEMAINE",
  MAX_MOIS: "MAX_MOIS",
  MIN_SEMESTRE: "MIN_SEMESTRE",
  MAX_SEMESTRE: "MAX_SEMESTRE",
} as const;
export type TypeDerogation = (typeof TYPE_DEROGATION)[keyof typeof TYPE_DEROGATION];

export const TYPE_DEROGATION_LABELS: Record<TypeDerogation, string> = {
  MIN_MOIS: "Minimum de gardes / mois",
  MAX_SEMAINE: "Maximum de gardes / semaine",
  MAX_MOIS: "Maximum de gardes / mois",
  MIN_SEMESTRE: "Minimum de gardes / semestre",
  MAX_SEMESTRE: "Maximum de gardes / semestre",
};

export function minGardesMoisEffectif(
  statutMds: string,
  minGardesMois: number | null | undefined,
): number {
  if (minGardesMois != null) return minGardesMois;
  return MIN_GARDES_MOIS_DEFAUT[statutMds as StatutMds] ?? MIN_GARDES_MOIS_DEFAUT.NON_MDS;
}

export const BASE = {
  QUEBEC: "QUEBEC",
  MONTREAL: "MONTREAL",
} as const;
export type Base = (typeof BASE)[keyof typeof BASE];

export const BASE_LABELS: Record<Base, string> = {
  QUEBEC: "Québec",
  MONTREAL: "Montréal",
};

export const STATUT_ASSIGNATION = {
  GENERE: "GENERE",
  MANUEL: "MANUEL",
  RESERVE: "RESERVE",
} as const;
export type StatutAssignation =
  (typeof STATUT_ASSIGNATION)[keyof typeof STATUT_ASSIGNATION];

export const SOURCE_INDISPONIBILITE = {
  DECLAREE: "DECLAREE",
  ESC: "ESC",
  REGULATEUR: "REGULATEUR",
  AUTRE: "AUTRE",
} as const;
export type SourceIndisponibilite =
  (typeof SOURCE_INDISPONIBILITE)[keyof typeof SOURCE_INDISPONIBILITE];

export const SOURCE_INDISPONIBILITE_LABELS: Record<SourceIndisponibilite, string> = {
  DECLAREE: "Indisponibilité déclarée",
  ESC: "Conflit avec un quart ESC",
  REGULATEUR: "Conflit avec un quart de médecin régulateur",
  AUTRE: "Autre",
};

// Regles souples reordonnables par James dans l'onglet "Priorites". La regle
// "non-disponibilites declarees" n'y figure pas : elle est appliquee comme
// une exclusion absolue (voir src/lib/moteur), jamais comme une penalite.
export const CLES_REGLES_PRIORITE = [
  "COUVERTURE",
  "MIN_GARDES",
  "QUARTS_CONSECUTIFS",
  "PROPORTION_WEEKEND",
  "QUARTS_WEEKEND_DESIRE",
] as const;
export type CleReglePriorite = (typeof CLES_REGLES_PRIORITE)[number];

export const REGLE_PRIORITE_LABELS: Record<CleReglePriorite, string> = {
  COUVERTURE: "Couverture complète des quarts (aucune garde non comblée)",
  MIN_GARDES: "Minimums de gardes (semaine / mois / semestre)",
  QUARTS_CONSECUTIFS: "Préférence de quarts consécutifs (médecins de la région de Québec)",
  PROPORTION_WEEKEND: "Plafond de fins de semaine / jours fériés par médecin",
  QUARTS_WEEKEND_DESIRE: "Nombre de quarts de fin de semaine désiré par médecin",
};

export const REGLE_PRIORITE_DESCRIPTIONS: Record<CleReglePriorite, string> = {
  COUVERTURE:
    "Priorité la plus haute après le respect des non-disponibilités déclarées : le moteur préfère toujours combler un quart plutôt que respecter une règle plus bas dans cette liste.",
  MIN_GARDES:
    "3 gardes/mois pour un MDS existant, 4 pour un non-MDS par défaut (sauf dérogation administrative).",
  QUARTS_CONSECUTIFS:
    "Contrainte dure pour les médecins résidant hors de la région de Québec — n'apparaît ici que pour les médecins de la région.",
  PROPORTION_WEEKEND:
    "Par défaut, au plus 35 % des quarts d'un médecin sur la période sont des fins de semaine ou jours fériés.",
  QUARTS_WEEKEND_DESIRE:
    "Nombre de quarts de fin de semaine que le médecin a indiqué vouloir, proportionnellement à la période générée.",
};

export const PLAFOND_WEEKEND_DEFAUT = 0.35;

export const HEURE_DEBUT_QUART_DEFAUT = "07:00";
export const HEURE_FIN_QUART_DEFAUT = "19:00";

// Types de fichiers de formulaire acceptes pour l'ingestion.
export const TYPES_FICHIERS_ACCEPTES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
];
