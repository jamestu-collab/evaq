import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ValidationForm from "@/components/ingestion/ValidationForm";

export const dynamic = "force-dynamic";

export default async function ValidationFormulairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    },
  });

  if (!formulaire) notFound();

  const medecins = await prisma.medecin.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });

  return (
    <div className="space-y-6">
      <Link href="/ingestion" className="text-sm text-slate-500 hover:underline">
        ← Ingestion des formulaires
      </Link>
      <h1 className="text-xl font-semibold">{formulaire.nomFichier}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden h-[70vh]">
          {formulaire.typeMime === "application/pdf" ||
          formulaire.typeMime.startsWith("image/") ? (
            <iframe
              src={`/api/formulaires/${formulaire.id}/fichier`}
              className="w-full h-full"
              title="Document original"
            />
          ) : (
            <div className="p-6 text-sm text-slate-500">
              Aperçu non disponible pour ce type de fichier.{" "}
              <a
                href={`/api/formulaires/${formulaire.id}/fichier`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 underline"
              >
                Télécharger le document original
              </a>
              .
            </div>
          )}
        </div>

        <ValidationForm formulaire={formulaire} medecins={medecins} />
      </div>
    </div>
  );
}
