import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MedecinSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inclureInactifs = searchParams.get("inclureInactifs") === "1";

  const medecins = await prisma.medecin.findMany({
    where: inclureInactifs ? {} : { actif: true },
    orderBy: { nom: "asc" },
    include: {
      derogations: true,
      _count: { select: { formulaires: true } },
    },
  });

  return NextResponse.json({ medecins });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = MedecinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const medecin = await prisma.medecin.create({
    data: {
      nom: data.nom,
      email: data.email || null,
      telephone: data.telephone || null,
      statutMds: data.statutMds,
      couvreQuebec: data.couvreQuebec,
      couvreMontreal: data.couvreMontreal,
      minGardesMois: data.minGardesMois ?? null,
      minGardesSemestre: data.minGardesSemestre ?? null,
      maxGardesSemaine: data.maxGardesSemaine,
      maxGardesMois: data.maxGardesMois,
      maxGardesSemestre: data.maxGardesSemestre ?? null,
      preferenceQuartsConsecutifs: data.preferenceQuartsConsecutifs,
      maxQuartsConsecutifs: data.maxQuartsConsecutifs ?? null,
      resideHorsQuebec: data.resideHorsQuebec,
      nbQuartsWeekendDesire: data.nbQuartsWeekendDesire ?? null,
      proportionAdditionnelleWeekend: data.proportionAdditionnelleWeekend ?? null,
      commentaires: data.commentaires || null,
    },
  });

  return NextResponse.json({ medecin }, { status: 201 });
}
