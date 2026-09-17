import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MedecinSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const medecin = await prisma.medecin.findUnique({
    where: { id },
    include: {
      derogations: { orderBy: { dateDebut: "desc" } },
      formulaires: {
        orderBy: { soumisLe: "desc" },
        select: {
          id: true,
          nomFichier: true,
          typeMime: true,
          soumisLe: true,
          statut: true,
          nomDetecte: true,
          extractionIA: true,
          donneesValidees: true,
          erreurExtraction: true,
          valideLe: true,
        },
      },
    },
  });

  if (!medecin) {
    return NextResponse.json({ erreur: "Médecin introuvable." }, { status: 404 });
  }

  return NextResponse.json({ medecin });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  // Reactivation / desactivation seule (sans repasser toute la validation complete)
  if (typeof body.actif === "boolean" && Object.keys(body).length === 1) {
    const medecin = await prisma.medecin.update({
      where: { id },
      data: { actif: body.actif },
    });
    return NextResponse.json({ medecin });
  }

  const parsed = MedecinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const medecin = await prisma.medecin.update({
    where: { id },
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
      ...(data.actif !== undefined ? { actif: data.actif } : {}),
    },
  });

  return NextResponse.json({ medecin });
}

// Retrait de la liste active (desactivation) plutot qu'une suppression
// destructrice, afin de preserver le journal d'audit des formulaires lies.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const medecin = await prisma.medecin.update({
    where: { id },
    data: { actif: false },
  });
  return NextResponse.json({ medecin });
}
