import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut");
  const medecinId = searchParams.get("medecinId");

  const formulaires = await prisma.formulaireSoumis.findMany({
    where: {
      ...(statut ? { statut } : {}),
      ...(medecinId ? { medecinId } : {}),
    },
    orderBy: { soumisLe: "desc" },
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

  return NextResponse.json({ formulaires });
}
