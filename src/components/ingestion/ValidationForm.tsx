"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ExtractionFormulaire } from "@/lib/ai/extraction";
import {
  PREFERENCE_QUARTS_CONSECUTIFS,
  PREFERENCE_QUARTS_CONSECUTIFS_LABELS,
  STATUT_FORMULAIRE,
} from "@/lib/constants";

type Formulaire = {
  id: string;
  nomFichier: string;
  statut: string;
  medecinId: string | null;
  nomDetecte: string | null;
  extractionIA: unknown;
  donneesValidees: unknown;
  erreurExtraction: string | null;
};

type Medecin = { id: string; nom: string };

const NOUVEAU_MEDECIN = "__nouveau__";

function champTexte(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

export default function ValidationForm({
  formulaire,
  medecins,
}: {
  formulaire: Formulaire;
  medecins: Medecin[];
}) {
  const router = useRouter();
  const extraction = (formulaire.donneesValidees ??
    formulaire.extractionIA ??
    {}) as Partial<ExtractionFormulaire>;

  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [medecinSelectionne, setMedecinSelectionne] = useState<string>(
    formulaire.medecinId ?? (medecins.length === 0 ? NOUVEAU_MEDECIN : ""),
  );
  const [nouveauMedecinNom, setNouveauMedecinNom] = useState(
    formulaire.medecinId ? "" : (extraction.nom ?? formulaire.nomDetecte ?? ""),
  );

  const [minGardesMois, setMinGardesMois] = useState(champTexte(extraction.minGardesMois));
  const [minGardesSemestre, setMinGardesSemestre] = useState(
    champTexte(extraction.minGardesSemestre),
  );
  const [maxGardesSemaine, setMaxGardesSemaine] = useState(
    champTexte(extraction.maxGardesSemaine),
  );
  const [maxGardesMois, setMaxGardesMois] = useState(champTexte(extraction.maxGardesMois));
  const [maxGardesSemestre, setMaxGardesSemestre] = useState(
    champTexte(extraction.maxGardesSemestre),
  );
  const [preferenceQuartsConsecutifs, setPreferenceQuartsConsecutifs] = useState(
    extraction.preferenceQuartsConsecutifs ?? "",
  );
  const [maxQuartsConsecutifs, setMaxQuartsConsecutifs] = useState(
    champTexte(extraction.maxQuartsConsecutifs),
  );
  const [nbQuartsWeekendDesire, setNbQuartsWeekendDesire] = useState(
    champTexte(extraction.nbQuartsWeekendDesire),
  );
  const [proportionAdditionnelleWeekend, setProportionAdditionnelleWeekend] = useState(
    champTexte(extraction.proportionAdditionnelleWeekend),
  );
  const [commentaires, setCommentaires] = useState(extraction.commentaires ?? "");

  const dejaTraite = formulaire.statut !== STATUT_FORMULAIRE.EN_ATTENTE;

  async function valider() {
    setErreur(null);
    if (!medecinSelectionne) {
      setErreur("Sélectionnez un médecin ou créez-en un nouveau.");
      return;
    }
    if (medecinSelectionne === NOUVEAU_MEDECIN && !nouveauMedecinNom.trim()) {
      setErreur("Indiquez le nom du nouveau médecin.");
      return;
    }

    setEnvoi(true);
    const res = await fetch(`/api/formulaires/${formulaire.id}/valider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medecinId: medecinSelectionne === NOUVEAU_MEDECIN ? null : medecinSelectionne,
        nouveauMedecinNom:
          medecinSelectionne === NOUVEAU_MEDECIN ? nouveauMedecinNom.trim() : null,
        donnees: {
          minGardesMois: minGardesMois === "" ? null : Number(minGardesMois),
          minGardesSemestre: minGardesSemestre === "" ? null : Number(minGardesSemestre),
          maxGardesSemaine: maxGardesSemaine === "" ? null : Number(maxGardesSemaine),
          maxGardesMois: maxGardesMois === "" ? null : Number(maxGardesMois),
          maxGardesSemestre: maxGardesSemestre === "" ? null : Number(maxGardesSemestre),
          preferenceQuartsConsecutifs: preferenceQuartsConsecutifs || null,
          maxQuartsConsecutifs:
            maxQuartsConsecutifs === "" ? null : Number(maxQuartsConsecutifs),
          nbQuartsWeekendDesire:
            nbQuartsWeekendDesire === "" ? null : Number(nbQuartsWeekendDesire),
          proportionAdditionnelleWeekend:
            proportionAdditionnelleWeekend === ""
              ? null
              : Number(proportionAdditionnelleWeekend),
          commentaires: commentaires || null,
        },
        appliquerAuProfil: true,
      }),
    });

    setEnvoi(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.erreur ?? "Erreur lors de la validation.");
      return;
    }

    router.push("/ingestion");
    router.refresh();
  }

  async function rejeter() {
    const motif = prompt("Motif du rejet (optionnel) :") ?? undefined;
    setEnvoi(true);
    await fetch(`/api/formulaires/${formulaire.id}/rejeter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motif }),
    });
    setEnvoi(false);
    router.push("/ingestion");
    router.refresh();
  }

  return (
    <div className="card p-6 space-y-6 overflow-y-auto h-[70vh]">
      {formulaire.erreurExtraction && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          L&apos;extraction automatique a échoué : {formulaire.erreurExtraction}. Vous pouvez saisir les champs manuellement à partir du document original.
        </div>
      )}
      {extraction.noteExtraction && (
        <div className="rounded-md bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 text-sm">
          Note de l&apos;IA : {extraction.noteExtraction}
        </div>
      )}
      {erreur && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {erreur}
        </div>
      )}
      {dejaTraite && (
        <div className="rounded-md bg-slate-100 text-slate-600 px-4 py-3 text-sm">
          Ce formulaire a déjà été traité (statut : {formulaire.statut}). Vous pouvez tout de même le re-valider.
        </div>
      )}

      <div>
        <label className="text-sm block mb-1">Médecin</label>
        <select
          className="input"
          value={medecinSelectionne}
          onChange={(e) => setMedecinSelectionne(e.target.value)}
        >
          <option value="" disabled>
            — Sélectionner —
          </option>
          {medecins.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
          <option value={NOUVEAU_MEDECIN}>+ Nouveau médecin…</option>
        </select>
        {formulaire.nomDetecte && (
          <p className="text-xs text-slate-500 mt-1">Nom détecté sur le formulaire : {formulaire.nomDetecte}</p>
        )}
        {medecinSelectionne === NOUVEAU_MEDECIN && (
          <input
            className="input mt-2"
            placeholder="Nom complet du nouveau médecin"
            value={nouveauMedecinNom}
            onChange={(e) => setNouveauMedecinNom(e.target.value)}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="block mb-1">Min. / mois</span>
          <input
            type="number"
            className="input"
            value={minGardesMois}
            onChange={(e) => setMinGardesMois(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Min. / semestre</span>
          <input
            type="number"
            className="input"
            value={minGardesSemestre}
            onChange={(e) => setMinGardesSemestre(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Max. / semaine</span>
          <input
            type="number"
            className="input"
            value={maxGardesSemaine}
            onChange={(e) => setMaxGardesSemaine(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Max. / mois</span>
          <input
            type="number"
            className="input"
            value={maxGardesMois}
            onChange={(e) => setMaxGardesMois(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Max. / semestre</span>
          <input
            type="number"
            className="input"
            value={maxGardesSemestre}
            onChange={(e) => setMaxGardesSemestre(e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="block mb-1">Quarts consécutifs</span>
          <select
            className="input"
            value={preferenceQuartsConsecutifs ?? ""}
            onChange={(e) => setPreferenceQuartsConsecutifs(e.target.value)}
          >
            <option value="">—</option>
            {Object.values(PREFERENCE_QUARTS_CONSECUTIFS).map((p) => (
              <option key={p} value={p}>
                {PREFERENCE_QUARTS_CONSECUTIFS_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1">Nb max. consécutifs</span>
          <input
            type="number"
            className="input"
            value={maxQuartsConsecutifs}
            onChange={(e) => setMaxQuartsConsecutifs(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Nb quarts fin de semaine désiré</span>
          <input
            type="number"
            className="input"
            value={nbQuartsWeekendDesire}
            onChange={(e) => setNbQuartsWeekendDesire(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Proportion additionnelle (%)</span>
          <input
            type="number"
            className="input"
            value={proportionAdditionnelleWeekend}
            onChange={(e) => setProportionAdditionnelleWeekend(e.target.value)}
          />
        </label>
      </div>

      <label className="text-sm block">
        <span className="block mb-1">Commentaires libres</span>
        <textarea
          className="input min-h-20"
          value={commentaires ?? ""}
          onChange={(e) => setCommentaires(e.target.value)}
        />
      </label>

      <div className="flex gap-3 pt-2">
        <button className="btn-primary" onClick={valider} disabled={envoi}>
          {envoi ? "Enregistrement…" : "Valider et enregistrer au profil"}
        </button>
        <button className="btn-danger" onClick={rejeter} disabled={envoi}>
          Rejeter
        </button>
      </div>
    </div>
  );
}
