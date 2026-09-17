import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const formulaire = await prisma.formulaireSoumis.findUnique({
    where: { id },
    select: {
      id: true,
      nomFichier: true,
      typeMime: true,
      soumisLe: true,
      statut: true,
      medecinId: true,
      nomDetecte: true,
      extractionIA: true,
      donneesValidees: true,
      erreurExtraction: true,
      valideLe: true,
      medecin: { select: { id: true, nom: true } },
    },
  });

  if (!formulaire) {
    return NextResponse.json({ erreur: "Formulaire introuvable." }, { status: 404 });
  }

  return NextResponse.json({ formulaire });
}
