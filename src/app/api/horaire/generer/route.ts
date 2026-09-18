import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BASE } from "@/lib/constants";
import { genererHoraire } from "@/lib/moteur/generer";

export const maxDuration = 120;

const Schema = z.object({
  base: z.enum([BASE.QUEBEC, BASE.MONTREAL]),
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const rapport = await genererHoraire(parsed.data.base, parsed.data.dateDebut, parsed.data.dateFin);
    return NextResponse.json({ rapport });
  } catch (err) {
    return NextResponse.json(
      { erreur: err instanceof Error ? err.message : "Erreur inconnue lors de la génération." },
      { status: 500 },
    );
  }
}
