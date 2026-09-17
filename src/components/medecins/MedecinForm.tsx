"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  MAX_QUARTS_CONSECUTIFS_PLAFOND,
  MIN_GARDES_MOIS_DEFAUT,
  PREFERENCE_QUARTS_CONSECUTIFS,
  PREFERENCE_QUARTS_CONSECUTIFS_LABELS,
  STATUT_MDS,
  STATUT_MDS_LABELS,
} from "@/lib/constants";

type MedecinExistant = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  statutMds: string;
  couvreQuebec: boolean;
  couvreMontreal: boolean;
  minGardesMois: number | null;
  minGardesSemestre: number | null;
  maxGardesSemaine: number;
  maxGardesMois: number;
  maxGardesSemestre: number | null;
  preferenceQuartsConsecutifs: string;
  maxQuartsConsecutifs: number | null;
  resideHorsQuebec: boolean;
  nbQuartsWeekendDesire: number | null;
  proportionAdditionnelleWeekend: number | null;
  commentaires: string | null;
};

function champTexte(valeur: number | null): string {
  return valeur === null || valeur === undefined ? "" : String(valeur);
}

export default function MedecinForm({
  medecinExistant,
}: {
  medecinExistant?: MedecinExistant;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [nom, setNom] = useState(medecinExistant?.nom ?? "");
  const [email, setEmail] = useState(medecinExistant?.email ?? "");
  const [telephone, setTelephone] = useState(medecinExistant?.telephone ?? "");
  const [statutMds, setStatutMds] = useState(
    medecinExistant?.statutMds ?? STATUT_MDS.NON_MDS,
  );
  const [couvreQuebec, setCouvreQuebec] = useState(
    medecinExistant?.couvreQuebec ?? true,
  );
  const [couvreMontreal, setCouvreMontreal] = useState(
    medecinExistant?.couvreMontreal ?? false,
  );
  const [minGardesMois, setMinGardesMois] = useState(
    champTexte(medecinExistant?.minGardesMois ?? null),
  );
  const [minGardesSemestre, setMinGardesSemestre] = useState(
    champTexte(medecinExistant?.minGardesSemestre ?? null),
  );
  const [maxGardesSemaine, setMaxGardesSemaine] = useState(
    String(medecinExistant?.maxGardesSemaine ?? 4),
  );
  const [maxGardesMois, setMaxGardesMois] = useState(
    String(medecinExistant?.maxGardesMois ?? 8),
  );
  const [maxGardesSemestre, setMaxGardesSemestre] = useState(
    champTexte(medecinExistant?.maxGardesSemestre ?? null),
  );
  const [preferenceQuartsConsecutifs, setPreferenceQuartsConsecutifs] = useState(
    medecinExistant?.preferenceQuartsConsecutifs ?? PREFERENCE_QUARTS_CONSECUTIFS.PEU_IMPORTE,
  );
  const [maxQuartsConsecutifs, setMaxQuartsConsecutifs] = useState(
    champTexte(medecinExistant?.maxQuartsConsecutifs ?? null),
  );
  const [resideHorsQuebec, setResideHorsQuebec] = useState(
    medecinExistant?.resideHorsQuebec ?? false,
  );
  const [nbQuartsWeekendDesire, setNbQuartsWeekendDesire] = useState(
    champTexte(medecinExistant?.nbQuartsWeekendDesire ?? null),
  );
  const [proportionAdditionnelleWeekend, setProportionAdditionnelleWeekend] = useState(
    champTexte(medecinExistant?.proportionAdditionnelleWeekend ?? null),
  );
  const [commentaires, setCommentaires] = useState(medecinExistant?.commentaires ?? "");

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    const payload = {
      nom,
      email: email || null,
      telephone: telephone || null,
      statutMds,
      couvreQuebec,
      couvreMontreal,
      minGardesMois: minGardesMois === "" ? null : Number(minGardesMois),
      minGardesSemestre: minGardesSemestre === "" ? null : Number(minGardesSemestre),
      maxGardesSemaine: Number(maxGardesSemaine),
      maxGardesMois: Number(maxGardesMois),
      maxGardesSemestre: maxGardesSemestre === "" ? null : Number(maxGardesSemestre),
      preferenceQuartsConsecutifs,
      maxQuartsConsecutifs:
        maxQuartsConsecutifs === "" ? null : Number(maxQuartsConsecutifs),
      resideHorsQuebec,
      nbQuartsWeekendDesire:
        nbQuartsWeekendDesire === "" ? null : Number(nbQuartsWeekendDesire),
      proportionAdditionnelleWeekend:
        proportionAdditionnelleWeekend === ""
          ? null
          : Number(proportionAdditionnelleWeekend),
      commentaires: commentaires || null,
    };

    const url = medecinExistant ? `/api/medecins/${medecinExistant.id}` : "/api/medecins";
    const method = medecinExistant ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.erreur ?? "Une erreur est survenue.");
      setEnvoi(false);
      return;
    }

    const data = await res.json();
    router.push(`/medecins/${data.medecin.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-8 max-w-3xl">
      {erreur && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {erreur}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Identité et coordonnées
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Champ label="Nom complet" required>
            <input
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </Champ>
          <Champ label="Courriel">
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Champ>
          <Champ label="Téléphone">
            <input
              className="input"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </Champ>
          <Champ label="Statut">
            <select
              className="input"
              value={statutMds}
              onChange={(e) => setStatutMds(e.target.value)}
            >
              {Object.values(STATUT_MDS).map((s) => (
                <option key={s} value={s}>
                  {STATUT_MDS_LABELS[s]}
                </option>
              ))}
            </select>
          </Champ>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={couvreQuebec}
              onChange={(e) => setCouvreQuebec(e.target.checked)}
            />
            Couvre la base de Québec
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={couvreMontreal}
              onChange={(e) => setCouvreMontreal(e.target.checked)}
            />
            Couvre la base de Montréal
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Minimums et maximums de gardes
        </h2>
        <p className="text-xs text-slate-500">
          Laisser vide pour utiliser la valeur par défaut selon le statut ({MIN_GARDES_MOIS_DEFAUT.MDS_EXISTANT}/mois MDS existant, {MIN_GARDES_MOIS_DEFAUT.NON_MDS}/mois non-MDS). Pour une dérogation temporaire, utilisez plutôt la section « Dérogations administratives » sur la fiche du médecin.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Champ label="Min. / mois">
            <input
              type="number"
              className="input"
              value={minGardesMois}
              onChange={(e) => setMinGardesMois(e.target.value)}
            />
          </Champ>
          <Champ label="Min. / semestre">
            <input
              type="number"
              className="input"
              value={minGardesSemestre}
              onChange={(e) => setMinGardesSemestre(e.target.value)}
            />
          </Champ>
          <div />
          <Champ label="Max. / semaine">
            <input
              type="number"
              className="input"
              value={maxGardesSemaine}
              onChange={(e) => setMaxGardesSemaine(e.target.value)}
            />
          </Champ>
          <Champ label="Max. / mois">
            <input
              type="number"
              className="input"
              value={maxGardesMois}
              onChange={(e) => setMaxGardesMois(e.target.value)}
            />
          </Champ>
          <Champ label="Max. / semestre">
            <input
              type="number"
              className="input"
              value={maxGardesSemestre}
              onChange={(e) => setMaxGardesSemestre(e.target.value)}
            />
          </Champ>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Préférences
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Champ label="Quarts consécutifs">
            <select
              className="input"
              value={preferenceQuartsConsecutifs}
              onChange={(e) => setPreferenceQuartsConsecutifs(e.target.value)}
            >
              {Object.values(PREFERENCE_QUARTS_CONSECUTIFS).map((p) => (
                <option key={p} value={p}>
                  {PREFERENCE_QUARTS_CONSECUTIFS_LABELS[p]}
                </option>
              ))}
            </select>
          </Champ>
          <Champ label={`Nb max. consécutifs (max ${MAX_QUARTS_CONSECUTIFS_PLAFOND})`}>
            <input
              type="number"
              min={1}
              max={MAX_QUARTS_CONSECUTIFS_PLAFOND}
              className="input"
              value={maxQuartsConsecutifs}
              onChange={(e) => setMaxQuartsConsecutifs(e.target.value)}
            />
          </Champ>
          <Champ label="Nb quarts de fin de semaine désiré">
            <input
              type="number"
              className="input"
              value={nbQuartsWeekendDesire}
              onChange={(e) => setNbQuartsWeekendDesire(e.target.value)}
            />
          </Champ>
          <Champ label="Proportion additionnelle souhaitée (%)">
            <input
              type="number"
              className="input"
              value={proportionAdditionnelleWeekend}
              onChange={(e) => setProportionAdditionnelleWeekend(e.target.value)}
            />
          </Champ>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={resideHorsQuebec}
            onChange={(e) => setResideHorsQuebec(e.target.checked)}
          />
          <span>
            Réside hors de la région de Québec
            <span className="block text-xs text-slate-500">
              La préférence de quarts consécutifs devient alors une contrainte dure (non négociable) pour ce médecin.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Commentaires
        </h2>
        <textarea
          className="input min-h-24"
          value={commentaires}
          onChange={(e) => setCommentaires(e.target.value)}
        />
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={envoi} className="btn-primary">
          {envoi ? "Enregistrement…" : medecinExistant ? "Enregistrer les modifications" : "Créer le médecin"}
        </button>
      </div>
    </form>
  );
}

function Champ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
