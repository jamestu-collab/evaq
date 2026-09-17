import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UploadWidget from "@/components/ingestion/UploadWidget";
import { STATUT_FORMULAIRE, STATUT_FORMULAIRE_LABELS, type StatutFormulaire } from "@/lib/constants";

export const dynamic = "force-dynamic";

const COULEURS_BADGE: Record<StatutFormulaire, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  VALIDE: "bg-emerald-100 text-emerald-800",
  REJETE: "bg-slate-200 text-slate-600",
  ERREUR: "bg-red-100 text-red-700",
};

export default async function IngestionPage() {
  const formulaires = await prisma.formulaireSoumis.findMany({
    orderBy: { soumisLe: "desc" },
    take: 100,
    select: {
      id: true,
      nomFichier: true,
      soumisLe: true,
      statut: true,
      nomDetecte: true,
      erreurExtraction: true,
      medecin: { select: { id: true, nom: true } },
    },
  });

  const aTraiter = formulaires.filter(
    (f) => f.statut === STATUT_FORMULAIRE.EN_ATTENTE || f.statut === STATUT_FORMULAIRE.ERREUR,
  );
  const traites = formulaires.filter(
    (f) => f.statut === STATUT_FORMULAIRE.VALIDE || f.statut === STATUT_FORMULAIRE.REJETE,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Ingestion des formulaires</h1>
        <p className="text-sm text-slate-500">
          Déposez les formulaires « Préférences – Liste de garde » soumis par les médecins. Les champs pertinents sont extraits automatiquement par IA, puis présentés ici pour validation avant d&apos;être enregistrés dans les profils.
        </p>
      </div>

      <UploadWidget />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          À traiter {aTraiter.length > 0 && `(${aTraiter.length})`}
        </h2>
        {aTraiter.length === 0 ? (
          <p className="text-sm text-slate-400">Rien à valider pour le moment.</p>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {aTraiter.map((f) => (
              <li key={f.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{f.nomFichier}</div>
                  <div className="text-xs text-slate-500">
                    Soumis le {new Date(f.soumisLe).toLocaleString("fr-CA")}
                    {f.nomDetecte && ` · nom détecté : ${f.nomDetecte}`}
                    {f.medecin && ` · suggestion : ${f.medecin.nom}`}
                  </div>
                  {f.erreurExtraction && (
                    <div className="text-xs text-red-600 mt-0.5">{f.erreurExtraction}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${COULEURS_BADGE[f.statut as StatutFormulaire]}`}>
                    {STATUT_FORMULAIRE_LABELS[f.statut as StatutFormulaire]}
                  </span>
                  <Link href={`/ingestion/${f.id}`} className="btn-secondary">
                    Examiner
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Traités récemment
        </h2>
        {traites.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun formulaire traité pour le moment.</p>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {traites.map((f) => (
              <li key={f.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{f.nomFichier}</div>
                  <div className="text-xs text-slate-500">
                    {f.medecin ? (
                      <Link href={`/medecins/${f.medecin.id}`} className="hover:underline">
                        {f.medecin.nom}
                      </Link>
                    ) : (
                      "Médecin non rattaché"
                    )}
                  </div>
                </div>
                <span className={`badge ${COULEURS_BADGE[f.statut as StatutFormulaire]}`}>
                  {STATUT_FORMULAIRE_LABELS[f.statut as StatutFormulaire]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
