import { z } from "zod";
import {
  MAX_QUARTS_CONSECUTIFS_PLAFOND,
  PREFERENCE_QUARTS_CONSECUTIFS,
  STATUT_MDS,
} from "@/lib/constants";

const optionalInt = z.coerce.number().int().nullable().optional();
const optionalFloat = z.coerce.number().nullable().optional();

export const MedecinSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis."),
  email: z.string().trim().email("Courriel invalide.").nullable().optional().or(z.literal("")),
  telephone: z.string().trim().nullable().optional().or(z.literal("")),
  statutMds: z.enum([STATUT_MDS.MDS_EXISTANT, STATUT_MDS.NON_MDS]),
  couvreQuebec: z.boolean().default(false),
  couvreMontreal: z.boolean().default(false),
  minGardesMois: optionalInt,
  minGardesSemestre: optionalInt,
  maxGardesSemaine: z.coerce.number().int().min(0).default(4),
  maxGardesMois: z.coerce.number().int().min(0).default(8),
  maxGardesSemestre: optionalInt,
  preferenceQuartsConsecutifs: z.enum([
    PREFERENCE_QUARTS_CONSECUTIFS.OUI,
    PREFERENCE_QUARTS_CONSECUTIFS.NON,
    PREFERENCE_QUARTS_CONSECUTIFS.PEU_IMPORTE,
  ]),
  maxQuartsConsecutifs: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_QUARTS_CONSECUTIFS_PLAFOND)
    .nullable()
    .optional(),
  resideHorsQuebec: z.boolean().default(false),
  nbQuartsWeekendDesire: optionalInt,
  proportionAdditionnelleWeekend: optionalFloat,
  commentaires: z.string().trim().nullable().optional().or(z.literal("")),
  actif: z.boolean().optional(),
}).refine((data) => data.couvreQuebec || data.couvreMontreal, {
  message: "Le médecin doit couvrir au moins une base (Québec ou Montréal).",
  path: ["couvreQuebec"],
});

export type MedecinInput = z.infer<typeof MedecinSchema>;

export const DerogationSchema = z.object({
  type: z.enum(["MIN_MOIS", "MAX_SEMAINE", "MAX_MOIS", "MIN_SEMESTRE", "MAX_SEMESTRE"]),
  valeur: z.coerce.number().int(),
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date().nullable().optional(),
  motif: z.string().trim().nullable().optional().or(z.literal("")),
});

export const ValidationFormulaireSchema = z.object({
  medecinId: z.string().min(1).nullable().optional(),
  nouveauMedecinNom: z.string().trim().min(1).nullable().optional(),
  donnees: z.object({
    minGardesMois: optionalInt,
    minGardesSemestre: optionalInt,
    maxGardesSemaine: optionalInt,
    maxGardesMois: optionalInt,
    maxGardesSemestre: optionalInt,
    preferenceQuartsConsecutifs: z
      .enum([
        PREFERENCE_QUARTS_CONSECUTIFS.OUI,
        PREFERENCE_QUARTS_CONSECUTIFS.NON,
        PREFERENCE_QUARTS_CONSECUTIFS.PEU_IMPORTE,
      ])
      .nullable()
      .optional(),
    maxQuartsConsecutifs: optionalInt,
    nbQuartsWeekendDesire: optionalInt,
    proportionAdditionnelleWeekend: optionalFloat,
    commentaires: z.string().trim().nullable().optional().or(z.literal("")),
  }),
  appliquerAuProfil: z.boolean().default(true),
});
