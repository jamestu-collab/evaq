"use client";

import { useCallback, useEffect, useState } from "react";
import { BASE, BASE_LABELS, type Base } from "@/lib/constants";
import type { RapportGeneration } from "@/lib/moteur/generer";
import RapportGenerationView from "./RapportGenerationView";

type Medecin = { id: string; nom: string; couvreQuebec: boolean; couvreMontreal: boolean };
type Assignation = {
  id: string;
  date: string;
  medecinId: string;
  medecin: { id: string; nom: string };
  statut: string;
  verrouille: boolean;
};

function joursEntre(debut: string, fin: string): string[] {
  const dates: string[] = [];
  const d = new Date(debut + "T00:00:00.000Z");
  const f = new Date(fin + "T00:00:00.000Z");
  while (d.getTime() <= f.getTime()) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

const JOURS_SEMAINE = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

export default function HoraireManager({
  parametresHoraire,
  medecins,
}: {
  parametresHoraire: { dateDebut: string; dateFin: string } | null;
  medecins: Medecin[];
}) {
  const [base, setBase] = useState<Base>(BASE.QUEBEC);
  const [dateDebut, setDateDebut] = useState(parametresHoraire?.dateDebut ?? "");
  const [dateFin, setDateFin] = useState(parametresHoraire?.dateFin ?? "");
  const [assignations, setAssignations] = useState<Assignation[]>([]);
  const [chargement, setChargement] = useState(false);
  const [generation, setGeneration] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [rapport, setRapport] = useState<RapportGeneration | null>(null);

  const medecinsPourBase = medecins.filter((m) =>
    base === BASE.QUEBEC ? m.couvreQuebec : m.couvreMontreal,
  );

  const chargerAssignations = useCallback(async () => {
    if (!dateDebut || !dateFin) return;
    setChargement(true);
    const res = await fetch(`/api/horaire?base=${base}&dateDebut=${dateDebut}&dateFin=${dateFin}`);
    setChargement(false);
    if (res.ok) {
      const data = await res.json();
      setAssignations(data.assignations);
    }
  }, [base, dateDebut, dateFin]);

  useEffect(() => {
    // Chargement des donnees depuis l'API au montage et a chaque changement
    // de periode ou de base : pas de bibliotheque de fetching de donnees
    // dans ce projet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    chargerAssignations();
  }, [chargerAssignations]);

  function changerBase(nouvelleBase: Base) {
    setBase(nouvelleBase);
    setRapport(null);
    setErreur(null);
  }

  async function generer() {
    setErreur(null);
    setGeneration(true);
    setRapport(null);
    const res = await fetch("/api/horaire/generer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base, dateDebut, dateFin }),
    });
    setGeneration(false);
    const data = await res.json();
    if (!res.ok) {
      setErreur(data?.erreur ?? "Erreur lors de la génération.");
      return;
    }
    setRapport(data.rapport);
    chargerAssignations();
  }

  async function assigner(date: string, medecinId: string, statut: "MANUEL" | "RESERVE") {
    if (!medecinId) {
      await fetch(`/api/horaire/assignation?base=${base}&date=${date}`, { method: "DELETE" });
    } else {
      await fetch("/api/horaire/assignation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base, date, medecinId, statut }),
      });
    }
    chargerAssignations();
  }

  const parDate = new Map(assignations.map((a) => [a.date.slice(0, 10), a]));
  const jours = dateDebut && dateFin ? joursEntre(dateDebut, dateFin) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Horaire — {BASE_LABELS[base]}</h1>

      <div className="card p-4 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="block mb-1">Base</span>
          <select
            className="input"
            value={base}
            onChange={(e) => changerBase(e.target.value as Base)}
          >
            {Object.values(BASE).map((b) => (
              <option key={b} value={b}>
                {BASE_LABELS[b]}
              </option>
            ))}
          </select>
        </label>
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
        <button className="btn-primary" onClick={generer} disabled={generation || !dateDebut || !dateFin}>
          {generation ? "Génération en cours…" : "Générer l'horaire"}
        </button>
      </div>

      {medecinsPourBase.length === 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
          Aucun médecin actif ne couvre la base de {BASE_LABELS[base]} pour le moment. Ajoute ou ajuste des profils dans la section Médecins avant de générer.
        </div>
      )}

      {erreur && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {erreur}
        </div>
      )}

      {rapport && <RapportGenerationView rapport={rapport} />}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Médecin assigné</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Modifier</th>
            </tr>
          </thead>
          <tbody>
            {jours.map((date) => {
              const a = parDate.get(date);
              const d = new Date(date + "T00:00:00.000Z");
              const weekend = [0, 6].includes(d.getUTCDay());
              return (
                <tr
                  key={date}
                  className={`border-b border-slate-100 last:border-0 ${weekend ? "bg-slate-50" : ""}`}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    {JOURS_SEMAINE[d.getUTCDay()]} {date}
                  </td>
                  <td className="px-4 py-2">
                    {a ? (
                      a.medecin.nom
                    ) : (
                      <span className="text-amber-600">Non comblé</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {a && (
                      <span className="badge bg-slate-100 text-slate-600">
                        {a.verrouille ? `🔒 ${a.statut}` : a.statut}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="input py-1 text-xs"
                      value={a?.medecinId ?? ""}
                      onChange={(e) => assigner(date, e.target.value, "MANUEL")}
                    >
                      <option value="">— Aucun —</option>
                      {medecinsPourBase.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {jours.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Choisis une période pour voir l&apos;horaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {chargement && <p className="px-4 py-2 text-xs text-slate-400">Chargement…</p>}
      </div>
    </div>
  );
}
