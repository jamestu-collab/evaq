import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MedecinForm from "@/components/medecins/MedecinForm";
import DerogationsManager from "@/components/medecins/DerogationsManager";
import ActionsMedecin from "@/components/medecins/ActionsMedecin";
import HistoriqueFormulaires from "@/components/medecins/HistoriqueFormulaires";
import IndisponibilitesManager from "@/components/medecins/IndisponibilitesManager";
import { BASE_LABELS, PREFERENCE_QUARTS_CONSECUTIFS_LABELS } from "@/lib/constants";

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
      indisponibilites: { orderBy: { dateDebut: "desc" } },
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

  const assignations = await prisma.assignation.findMany({
    where: { medecinId: id },
    select: { date: true, base: true },
  });
  const nbAssignations = assignations.length;
  const nbWeekend = assignations.filter((a) => [0, 6].includes(new Date(a.date).getUTCDay())).length;
  const bases = [...new Set(assignations.map((a) => a.base))];

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
          Indisponibilités
        </h2>
        <IndisponibilitesManager medecinId={medecin.id} indisponibilites={medecin.indisponibilites} />
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
        {nbAssignations === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun quart assigné pour le moment — génère un horaire pour voir la comparaison ici.
          </p>
        ) : (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Gardes assignées</dt>
              <dd className="font-medium">{nbAssignations}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Dont fins de semaine</dt>
              <dd className="font-medium">
                {nbWeekend} ({Math.round((nbWeekend / nbAssignations) * 100)} %)
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Fins de semaine désirées</dt>
              <dd className="font-medium">{medecin.nbQuartsWeekendDesire ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Bases couvertes dans l&apos;horaire</dt>
              <dd className="font-medium">{bases.map((b) => BASE_LABELS[b as keyof typeof BASE_LABELS] ?? b).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Préférence quarts consécutifs</dt>
              <dd className="font-medium">
                {PREFERENCE_QUARTS_CONSECUTIFS_LABELS[
                  medecin.preferenceQuartsConsecutifs as keyof typeof PREFERENCE_QUARTS_CONSECUTIFS_LABELS
                ] ?? medecin.preferenceQuartsConsecutifs}
              </dd>
            </div>
          </dl>
        )}
        <p className="text-xs text-slate-400 mt-3">
          Pour le détail jour par jour et les écarts précis avec les règles, voir le tableau de statistiques produit après chaque génération, sur la page Horaire.
        </p>
      </div>
    </div>
  );
}
