import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUT_FORMULAIRE } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const motif: string | undefined = body?.motif;

  const formulaire = await prisma.formulaireSoumis.update({
    where: { id },
    data: {
      statut: STATUT_FORMULAIRE.REJETE,
      donneesValidees: motif ? { motifRejet: motif } : undefined,
    },
  });

  return NextResponse.json({ formulaire });
}
