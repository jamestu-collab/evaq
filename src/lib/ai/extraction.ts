import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { z } from "zod";

export const ExtractionFormulaireSchema = z.object({
  nom: z.string().nullable(),
  minGardesMois: z.number().int().nullable(),
  minGardesSemestre: z.number().int().nullable(),
  maxGardesSemaine: z.number().int().nullable(),
  maxGardesMois: z.number().int().nullable(),
  maxGardesSemestre: z.number().int().nullable(),
  preferenceQuartsConsecutifs: z
    .enum(["OUI", "NON", "PEU_IMPORTE"])
    .nullable(),
  maxQuartsConsecutifs: z.number().int().nullable(),
  nbQuartsWeekendDesire: z.number().int().nullable(),
  proportionAdditionnelleWeekend: z.number().nullable(),
  resideHorsQuebec: z.boolean().nullable(),
  couvreQuebec: z.boolean().nullable(),
  couvreMontreal: z.boolean().nullable(),
  commentaires: z.string().nullable(),
  noteExtraction: z.string().nullable(),
});

export type ExtractionFormulaire = z.infer<typeof ExtractionFormulaireSchema>;

const OUTIL_EXTRACTION = {
  name: "enregistrer_extraction",
  description:
    "Enregistre les champs extraits du formulaire de préférences ÉVAQ/TMH.",
  input_schema: {
    type: "object" as const,
    properties: {
      nom: {
        type: ["string", "null"],
        description: "Nom complet du médecin tel qu'il apparaît sur le formulaire.",
      },
      minGardesMois: {
        type: ["integer", "null"],
        description: "Minimum de gardes par mois demandé.",
      },
      minGardesSemestre: {
        type: ["integer", "null"],
        description: "Minimum de gardes pour le semestre.",
      },
      maxGardesSemaine: {
        type: ["integer", "null"],
        description: "Maximum de gardes par semaine.",
      },
      maxGardesMois: {
        type: ["integer", "null"],
        description: "Maximum de gardes par mois.",
      },
      maxGardesSemestre: {
        type: ["integer", "null"],
        description: "Maximum de gardes pour le semestre.",
      },
      preferenceQuartsConsecutifs: {
        type: ["string", "null"],
        enum: ["OUI", "NON", "PEU_IMPORTE", null],
        description: "Préférence de quarts consécutifs.",
      },
      maxQuartsConsecutifs: {
        type: ["integer", "null"],
        description: "Nombre maximal de quarts consécutifs souhaité (max 4), si applicable.",
      },
      nbQuartsWeekendDesire: {
        type: ["integer", "null"],
        description: "Nombre de quarts de fin de semaine désiré.",
      },
      proportionAdditionnelleWeekend: {
        type: ["number", "null"],
        description:
          "Proportion additionnelle de fins de semaine souhaitée, en pourcentage (ex. 10 pour 10%).",
      },
      resideHorsQuebec: {
        type: ["boolean", "null"],
        description: "Vrai si le médecin indique résider hors de la région de Québec.",
      },
      couvreQuebec: {
        type: ["boolean", "null"],
        description: "Vrai si le formulaire indique une couverture de la base de Québec.",
      },
      couvreMontreal: {
        type: ["boolean", "null"],
        description: "Vrai si le formulaire indique une couverture de la base de Montréal.",
      },
      commentaires: {
        type: ["string", "null"],
        description: "Commentaires libres laissés par le médecin sur le formulaire.",
      },
      noteExtraction: {
        type: ["string", "null"],
        description:
          "Note à l'intention de l'administrateur : champs ambigus, illisibles, ou déduits plutôt que lus directement.",
      },
    },
    required: [
      "nom",
      "minGardesMois",
      "minGardesSemestre",
      "maxGardesSemaine",
      "maxGardesMois",
      "maxGardesSemestre",
      "preferenceQuartsConsecutifs",
      "maxQuartsConsecutifs",
      "nbQuartsWeekendDesire",
      "proportionAdditionnelleWeekend",
      "resideHorsQuebec",
      "couvreQuebec",
      "couvreMontreal",
      "commentaires",
      "noteExtraction",
    ],
  },
};

const PROMPT_SYSTEME = `Tu extrais les données du formulaire "Préférences – Liste de garde" utilisé par le programme TMH/ÉVAQ. Le formulaire peut être rempli à la main (scan/photo) ou électroniquement. Lis attentivement tous les champs, y compris les mentions manuscrites, cases cochées et annotations en marge. Si un champ est absent, illisible ou ambigu, retourne null pour ce champ plutôt que de deviner, et explique la situation dans "noteExtraction". N'invente jamais de valeur. Utilise toujours l'outil fourni pour répondre.`;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY n'est pas configurée. Ajoutez-la dans le fichier .env pour activer l'extraction automatique.",
    );
  }
  return new Anthropic({ apiKey });
}

function buildContentBlock(
  buffer: Buffer,
  mimeType: string,
): Anthropic.Messages.ContentBlockParam {
  if (mimeType === "application/pdf") {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: buffer.toString("base64"),
      },
    };
  }

  if (mimeType.startsWith("image/")) {
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType as "image/png" | "image/jpeg" | "image/webp",
        data: buffer.toString("base64"),
      },
    };
  }

  // Texte brut (docx déjà converti en amont, ou .txt)
  return {
    type: "text",
    text: buffer.toString("utf-8"),
  };
}

async function normaliserFichier(
  buffer: Buffer,
  mimeType: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return { buffer: Buffer.from(value, "utf-8"), mimeType: "text/plain" };
  }
  return { buffer, mimeType };
}

export async function extraireFormulaire(
  fichierBuffer: Buffer,
  mimeTypeOriginal: string,
  nomFichier: string,
): Promise<
  | { succes: true; donnees: ExtractionFormulaire }
  | { succes: false; erreur: string }
> {
  try {
    const client = getClient();
    const { buffer, mimeType } = await normaliserFichier(
      fichierBuffer,
      mimeTypeOriginal,
    );

    const contentBlock = buildContentBlock(buffer, mimeType);

    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

    const message = await client.messages.create({
      model,
      max_tokens: 2048,
      system: PROMPT_SYSTEME,
      tools: [OUTIL_EXTRACTION],
      tool_choice: { type: "tool", name: OUTIL_EXTRACTION.name },
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: `Fichier soumis : "${nomFichier}". Extrait les champs demandés à partir de ce formulaire.`,
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use",
    );

    if (!toolUse) {
      return {
        succes: false,
        erreur: "Le modèle n'a pas retourné de données structurées.",
      };
    }

    const parsed = ExtractionFormulaireSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      return {
        succes: false,
        erreur: `Réponse du modèle invalide : ${parsed.error.message}`,
      };
    }

    return { succes: true, donnees: parsed.data };
  } catch (err) {
    return {
      succes: false,
      erreur: err instanceof Error ? err.message : "Erreur inconnue lors de l'extraction.",
    };
  }
}
