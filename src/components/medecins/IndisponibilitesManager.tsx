"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SOURCE_INDISPONIBILITE, SOURCE_INDISPONIBILITE_LABELS } from "@/lib/constants";

type Indisponibilite = {
  id: string;
  dateDebut: Date | string;
  dateFin: Date | string;
  source: string;
  motif: string | null;
};

function formaterDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-CA");
}

export default function IndisponibilitesManager({
  medecinId,
  indisponibilites,
}: {
  medecinId: string;
  indisponibilites: Indisponibilite[];
}) {
  const router = useRouter();
  const [afficherForm, setAfficherForm] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [source, setSource] = useState<string>(SOURCE_INDISPONIBILITE.DECLAREE);
  const [motif, setMotif] = useState("");

  async function ajouter() {
    setErreur(null);
    if (!dateDebut || !dateFin) {
      setErreur("Les deux dates sont requises.");
      return;
    }
    setEnvoi(true);
    const res = await fetch(`/api/medecins/${medecinId}/indisponibilites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateDebut, dateFin, source, motif: motif || null }),
    });
    setEnvoi(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.erreur ?? "Erreur lors de l'ajout.");
      return;
    }
    setDateDebut("");
    setDateFin("");
    setMotif("");
    setAfficherForm(false);
    router.refresh();
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cette indisponibilité ?")) return;
    await fetch(`/api/indisponibilites/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Le moteur de génération ne proposera jamais ce médecin pour un quart pendant ces périodes — c&apos;est la règle la plus stricte, prioritaire même sur la couverture complète des quarts.
      </p>

      {indisponibilites.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md">
          {indisponibilites.map((i) => (
            <li key={i.id} className="px-3 py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">
                  {formaterDate(i.dateDebut)} → {formaterDate(i.dateFin)}
                </span>
                <span className="text-slate-500">
                  {" "}
                  · {SOURCE_INDISPONIBILITE_LABELS[i.source as keyof typeof SOURCE_INDISPONIBILITE_LABELS] ?? i.source}
                </span>
                {i.motif && <div className="text-slate-500 text-xs mt-0.5">{i.motif}</div>}
              </div>
              <button onClick={() => supprimer(i.id)} className="text-red-600 text-xs hover:underline">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {!afficherForm ? (
        <button className="btn-secondary" onClick={() => setAfficherForm(true)}>
          + Déclarer une indisponibilité
        </button>
      ) : (
        <div className="space-y-3 border border-slate-200 rounded-md p-4">
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1">Du</span>
              <input
                type="date"
                className="input"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">Au</span>
              <input
                type="date"
                className="input"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </label>
          </div>
          <label className="text-sm block">
            <span className="block mb-1">Source</span>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              {Object.values(SOURCE_INDISPONIBILITE).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_INDISPONIBILITE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm block">
            <span className="block mb-1">Motif (optionnel)</span>
            <input className="input" value={motif} onChange={(e) => setMotif(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={ajouter} disabled={envoi}>
              {envoi ? "Ajout…" : "Ajouter"}
            </button>
            <button className="btn-secondary" onClick={() => setAfficherForm(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
