import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SOURCE_INDISPONIBILITE } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
  source: z
    .enum([
      SOURCE_INDISPONIBILITE.DECLAREE,
      SOURCE_INDISPONIBILITE.ESC,
      SOURCE_INDISPONIBILITE.REGULATEUR,
      SOURCE_INDISPONIBILITE.AUTRE,
    ])
    .default(SOURCE_INDISPONIBILITE.DECLAREE),
  motif: z.string().trim().nullable().optional().or(z.literal("")),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (parsed.data.dateDebut > parsed.data.dateFin) {
    return NextResponse.json(
      { erreur: "La date de début doit précéder la date de fin." },
      { status: 400 },
    );
  }

  const indisponibilite = await prisma.indisponibilite.create({
    data: {
      medecinId: id,
      dateDebut: parsed.data.dateDebut,
      dateFin: parsed.data.dateFin,
      source: parsed.data.source,
      motif: parsed.data.motif || null,
    },
  });

  return NextResponse.json({ indisponibilite }, { status: 201 });
}
