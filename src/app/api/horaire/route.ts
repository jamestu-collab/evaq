import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BASE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base");
  const dateDebut = searchParams.get("dateDebut");
  const dateFin = searchParams.get("dateFin");

  if (!base || !Object.values(BASE).includes(base as (typeof BASE)[keyof typeof BASE])) {
    return NextResponse.json({ erreur: "Base invalide." }, { status: 400 });
  }
  if (!dateDebut || !dateFin) {
    return NextResponse.json({ erreur: "dateDebut et dateFin sont requis." }, { status: 400 });
  }

  const assignations = await prisma.assignation.findMany({
    where: {
      base,
      date: { gte: new Date(dateDebut), lte: new Date(dateFin) },
    },
    include: {
      medecin: { select: { id: true, nom: true } },
      typeQuart: { select: { nom: true, heureDebut: true, heureFin: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ assignations });
}
