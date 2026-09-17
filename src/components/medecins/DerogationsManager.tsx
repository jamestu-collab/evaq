"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TYPE_DEROGATION, TYPE_DEROGATION_LABELS } from "@/lib/constants";

type Derogation = {
  id: string;
  type: string;
  valeur: number;
  dateDebut: Date | string;
  dateFin: Date | string | null;
  motif: string | null;
};

function formaterDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-CA");
}

export default function DerogationsManager({
  medecinId,
  derogations,
}: {
  medecinId: string;
  derogations: Derogation[];
}) {
  const router = useRouter();
  const [afficherForm, setAfficherForm] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [type, setType] = useState<string>(TYPE_DEROGATION.MIN_MOIS);
  const [valeur, setValeur] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [motif, setMotif] = useState("");

  async function ajouter() {
    setErreur(null);
    if (!valeur || !dateDebut) {
      setErreur("La valeur et la date de début sont requises.");
      return;
    }
    setEnvoi(true);
    const res = await fetch(`/api/medecins/${medecinId}/derogations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        valeur: Number(valeur),
        dateDebut,
        dateFin: dateFin || null,
        motif: motif || null,
      }),
    });
    setEnvoi(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.erreur ?? "Erreur lors de l'ajout.");
      return;
    }
    setValeur("");
    setDateDebut("");
    setDateFin("");
    setMotif("");
    setAfficherForm(false);
    router.refresh();
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cette dérogation ?")) return;
    await fetch(`/api/derogations/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Permet de remplacer temporairement un minimum ou maximum standard pour ce médecin (transition d&apos;équipe, changement de statut, etc.), sans affecter les autres profils.
      </p>

      {derogations.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md">
          {derogations.map((d) => (
            <li key={d.id} className="px-3 py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">
                  {TYPE_DEROGATION_LABELS[d.type as keyof typeof TYPE_DEROGATION_LABELS] ?? d.type}
                </span>{" "}
                → {d.valeur}
                <span className="text-slate-500">
                  {" "}
                  · du {formaterDate(d.dateDebut)}
                  {d.dateFin ? ` au ${formaterDate(d.dateFin)}` : " (indéfini)"}
                </span>
                {d.motif && <div className="text-slate-500 text-xs mt-0.5">{d.motif}</div>}
              </div>
              <button
                onClick={() => supprimer(d.id)}
                className="text-red-600 text-xs hover:underline"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {!afficherForm ? (
        <button className="btn-secondary" onClick={() => setAfficherForm(true)}>
          + Ajouter une dérogation
        </button>
      ) : (
        <div className="space-y-3 border border-slate-200 rounded-md p-4">
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1">Règle</span>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                {Object.values(TYPE_DEROGATION).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_DEROGATION_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1">Nouvelle valeur</span>
              <input
                type="number"
                className="input"
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">Date de début</span>
              <input
                type="date"
                className="input"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">Date de fin (optionnel)</span>
              <input
                type="date"
                className="input"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </label>
          </div>
          <label className="text-sm block">
            <span className="block mb-1">Motif</span>
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
