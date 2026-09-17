import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const formulaire = await prisma.formulaireSoumis.findUnique({
    where: { id },
    select: { nomFichier: true, typeMime: true, contenuFichier: true },
  });

  if (!formulaire) {
    return NextResponse.json({ erreur: "Formulaire introuvable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(formulaire.contenuFichier), {
    headers: {
      "Content-Type": formulaire.typeMime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(formulaire.nomFichier)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
