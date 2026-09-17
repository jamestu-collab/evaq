import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MedecinForm from "@/components/medecins/MedecinForm";
import DerogationsManager from "@/components/medecins/DerogationsManager";
import ActionsMedecin from "@/components/medecins/ActionsMedecin";
import HistoriqueFormulaires from "@/components/medecins/HistoriqueFormulaires";

export const dynamic = "force-dynamic";

export default async function MedecinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          soumisLe: true,
          statut: true,
          valideLe: true,
          erreurExtraction: true,
        },
      },
    },
  });

  if (!medecin) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/medecins" className="text-sm text-slate-500 hover:underline">
              ← Médecins
            </Link>
          </div>
          <h1 className="text-xl font-semibold mt-1">
            {medecin.nom}
            {!medecin.actif && (
              <span className="badge bg-slate-200 text-slate-600 ml-2 align-middle">
                Inactif
              </span>
            )}
          </h1>
          {medecin.email && <p className="text-sm text-slate-500">{medecin.email}</p>}
        </div>
        <ActionsMedecin medecinId={medecin.id} actif={medecin.actif} />
      </div>

      <div className="card p-6">
        <MedecinForm
          medecinExistant={{
            id: medecin.id,
            nom: medecin.nom,
            email: medecin.email,
            telephone: medecin.telephone,
            statutMds: medecin.statutMds,
            couvreQuebec: medecin.couvreQuebec,
            couvreMontreal: medecin.couvreMontreal,
            minGardesMois: medecin.minGardesMois,
            minGardesSemestre: medecin.minGardesSemestre,
            maxGardesSemaine: medecin.maxGardesSemaine,
            maxGardesMois: medecin.maxGardesMois,
            maxGardesSemestre: medecin.maxGardesSemestre,
            preferenceQuartsConsecutifs: medecin.preferenceQuartsConsecutifs,
            maxQuartsConsecutifs: medecin.maxQuartsConsecutifs,
            resideHorsQuebec: medecin.resideHorsQuebec,
            nbQuartsWeekendDesire: medecin.nbQuartsWeekendDesire,
            proportionAdditionnelleWeekend: medecin.proportionAdditionnelleWeekend,
            commentaires: medecin.commentaires,
          }}
        />
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Dérogations administratives
        </h2>
        <DerogationsManager medecinId={medecin.id} derogations={medecin.derogations} />
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Journal d&apos;audit — formulaires soumis
        </h2>
        <HistoriqueFormulaires formulaires={medecin.formulaires} />
      </div>

      <div className="card p-6 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Comparaison demandé / assigné
        </h2>
        <p className="text-sm text-slate-500">
          Cette vue sera disponible une fois le moteur de génération d&apos;horaire en place : elle comparera automatiquement les préférences soumises par {medecin.nom.split(" ")[0]} aux quarts qui lui auront été assignés.
        </p>
      </div>
    </div>
  );
}
