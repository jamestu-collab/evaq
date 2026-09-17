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

// Types de fichiers de formulaire acceptes pour l'ingestion.
export const TYPES_FICHIERS_ACCEPTES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
];
