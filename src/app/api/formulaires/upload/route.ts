import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraireFormulaire } from "@/lib/ai/extraction";
import { meilleureCorrespondance } from "@/lib/matching";
import { STATUT_FORMULAIRE, TYPES_FICHIERS_ACCEPTES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 120;

const SEUIL_SUGGESTION = 0.55;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fichiers = formData.getAll("fichiers").filter((f): f is File => f instanceof File);

  if (fichiers.length === 0) {
    return NextResponse.json({ erreur: "Aucun fichier reçu." }, { status: 400 });
  }

  const medecinsActifs = await prisma.medecin.findMany({
    where: { actif: true },
    select: { id: true, nom: true },
  });

  const resultats = [];

  for (const fichier of fichiers) {
    const typeMime = fichier.type || "application/octet-stream";

    if (!TYPES_FICHIERS_ACCEPTES.includes(typeMime)) {
      resultats.push({
        nomFichier: fichier.name,
        ignore: true,
        raison: `Type de fichier non pris en charge (${typeMime || "inconnu"}).`,
      });
      continue;
    }

    const arrayBuffer = await fichier.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extraction = await extraireFormulaire(buffer, typeMime, fichier.name);

    let medecinId: string | null = null;
    let nomDetecte: string | null = null;

    if (extraction.succes && extraction.donnees.nom) {
      nomDetecte = extraction.donnees.nom;
      const correspondance = meilleureCorrespondance(
        extraction.donnees.nom,
        medecinsActifs,
        (m) => m.nom,
      );
      if (correspondance && correspondance.score >= SEUIL_SUGGESTION) {
        medecinId = correspondance.item.id;
      }
    }

    const formulaire = await prisma.formulaireSoumis.create({
      data: {
        nomFichier: fichier.name,
        typeMime,
        contenuFichier: buffer,
        statut: extraction.succes
          ? STATUT_FORMULAIRE.EN_ATTENTE
          : STATUT_FORMULAIRE.ERREUR,
        medecinId,
        nomDetecte,
        extractionIA: extraction.succes
          ? extraction.donnees
          : { erreur: extraction.erreur },
        erreurExtraction: extraction.succes ? null : extraction.erreur,
      },
    });

    resultats.push({
      id: formulaire.id,
      nomFichier: fichier.name,
      succes: extraction.succes,
      erreur: extraction.succes ? null : extraction.erreur,
    });
  }

  return NextResponse.json({ resultats });
}
