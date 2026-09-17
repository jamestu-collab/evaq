import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ValidationFormulaireSchema } from "@/lib/validation";
import { STATUT_FORMULAIRE, STATUT_MDS } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = ValidationFormulaireSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { medecinId, nouveauMedecinNom, donnees, appliquerAuProfil } = parsed.data;

  const formulaireExistant = await prisma.formulaireSoumis.findUnique({
    where: { id },
  });
  if (!formulaireExistant) {
    return NextResponse.json({ erreur: "Formulaire introuvable." }, { status: 404 });
  }

  if (!medecinId && !nouveauMedecinNom) {
    return NextResponse.json(
      { erreur: "Sélectionnez un médecin existant ou fournissez le nom d'un nouveau médecin." },
      { status: 400 },
    );
  }

  const extractionIA = formulaireExistant.extractionIA as Prisma.JsonObject | null;

  const resultat = await prisma.$transaction(async (tx) => {
    let idMedecinFinal = medecinId ?? null;

    if (!idMedecinFinal && nouveauMedecinNom) {
      const couvreQuebec = Boolean(extractionIA?.couvreQuebec) || !extractionIA?.couvreMontreal;
      const couvreMontreal = Boolean(extractionIA?.couvreMontreal);
      const nouveauMedecin = await tx.medecin.create({
        data: {
          nom: nouveauMedecinNom,
          statutMds: STATUT_MDS.NON_MDS,
          couvreQuebec,
          couvreMontreal,
        },
      });
      idMedecinFinal = nouveauMedecin.id;
    }

    const formulaire = await tx.formulaireSoumis.update({
      where: { id },
      data: {
        statut: STATUT_FORMULAIRE.VALIDE,
        medecinId: idMedecinFinal,
        donneesValidees: donnees,
        valideLe: new Date(),
      },
    });

    if (appliquerAuProfil && idMedecinFinal) {
      const misesAJour: Prisma.MedecinUpdateInput = {};
      if (donnees.minGardesMois != null) misesAJour.minGardesMois = donnees.minGardesMois;
      if (donnees.minGardesSemestre != null)
        misesAJour.minGardesSemestre = donnees.minGardesSemestre;
      if (donnees.maxGardesSemaine != null)
        misesAJour.maxGardesSemaine = donnees.maxGardesSemaine;
      if (donnees.maxGardesMois != null) misesAJour.maxGardesMois = donnees.maxGardesMois;
      if (donnees.maxGardesSemestre != null)
        misesAJour.maxGardesSemestre = donnees.maxGardesSemestre;
      if (donnees.preferenceQuartsConsecutifs != null)
        misesAJour.preferenceQuartsConsecutifs = donnees.preferenceQuartsConsecutifs;
      if (donnees.maxQuartsConsecutifs != null)
        misesAJour.maxQuartsConsecutifs = donnees.maxQuartsConsecutifs;
      if (donnees.nbQuartsWeekendDesire != null)
        misesAJour.nbQuartsWeekendDesire = donnees.nbQuartsWeekendDesire;
      if (donnees.proportionAdditionnelleWeekend != null)
        misesAJour.proportionAdditionnelleWeekend = donnees.proportionAdditionnelleWeekend;
      if (donnees.commentaires) misesAJour.commentaires = donnees.commentaires;

      if (Object.keys(misesAJour).length > 0) {
        await tx.medecin.update({ where: { id: idMedecinFinal }, data: misesAJour });
      }
    }

    return formulaire;
  });

  return NextResponse.json({ formulaire: resultat });
}
