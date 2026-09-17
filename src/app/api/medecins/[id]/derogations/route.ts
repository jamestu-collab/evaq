import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DerogationSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = DerogationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const derogation = await prisma.derogationAdministrative.create({
    data: {
      medecinId: id,
      type: data.type,
      valeur: data.valeur,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin ?? null,
      motif: data.motif || null,
    },
  });

  return NextResponse.json({ derogation }, { status: 201 });
}
