import Link from "next/link";
import {
  STATUT_FORMULAIRE,
  STATUT_FORMULAIRE_LABELS,
  type StatutFormulaire,
} from "@/lib/constants";

type Formulaire = {
  id: string;
  nomFichier: string;
  soumisLe: Date | string;
  statut: string;
  valideLe: Date | string | null;
  erreurExtraction: string | null;
};

const COULEURS_BADGE: Record<StatutFormulaire, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  VALIDE: "bg-emerald-100 text-emerald-800",
  REJETE: "bg-slate-200 text-slate-600",
  ERREUR: "bg-red-100 text-red-700",
};

export default function HistoriqueFormulaires({
  formulaires,
}: {
  formulaires: Formulaire[];
}) {
  if (formulaires.length === 0) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        Aucun formulaire soumis par ce médecin pour le moment.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md">
      {formulaires.map((f) => (
        <li key={f.id} className="px-3 py-2 flex items-center justify-between text-sm">
          <div>
            <a
              href={`/api/formulaires/${f.id}/fichier`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 hover:underline"
            >
              {f.nomFichier}
            </a>
            <div className="text-xs text-slate-500">
              Soumis le {new Date(f.soumisLe).toLocaleString("fr-CA")}
              {f.valideLe && ` · validé le ${new Date(f.valideLe).toLocaleString("fr-CA")}`}
            </div>
            {f.erreurExtraction && (
              <div className="text-xs text-red-600 mt-0.5">{f.erreurExtraction}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`badge ${COULEURS_BADGE[f.statut as StatutFormulaire] ?? "bg-slate-100 text-slate-600"}`}
            >
              {STATUT_FORMULAIRE_LABELS[f.statut as StatutFormulaire] ?? f.statut}
            </span>
            {f.statut === STATUT_FORMULAIRE.EN_ATTENTE && (
              <Link href={`/ingestion/${f.id}`} className="text-xs text-slate-600 hover:underline">
                Valider →
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
