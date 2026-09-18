"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  REGLE_PRIORITE_DESCRIPTIONS,
  REGLE_PRIORITE_LABELS,
  type CleReglePriorite,
} from "@/lib/constants";

type Regle = {
  id: string;
  cle: string;
  ordre: number;
  actif: boolean;
  exceptionGenerale: boolean;
  medecinsExceptionId: string[];
};

export default function PrioritesManager({
  reglesInitiales,
  medecins,
}: {
  reglesInitiales: Regle[];
  medecins: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [regles, setRegles] = useState(
    [...reglesInitiales].sort((a, b) => a.ordre - b.ordre),
  );
  const [exceptionsOuvertes, setExceptionsOuvertes] = useState<Set<string>>(new Set());
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);

  function deplacer(index: number, direction: -1 | 1) {
    const cible = index + direction;
    if (cible < 0 || cible >= regles.length) return;
    const copie = [...regles];
    [copie[index], copie[cible]] = [copie[cible], copie[index]];
    copie.forEach((r, i) => (r.ordre = i + 1));
    setRegles(copie);
    setSucces(false);
  }

  function mettreAJour(id: string, patch: Partial<Regle>) {
    setRegles((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSucces(false);
  }

  function basculerMedecinException(regle: Regle, medecinId: string) {
    const present = regle.medecinsExceptionId.includes(medecinId);
    mettreAJour(regle.id, {
      medecinsExceptionId: present
        ? regle.medecinsExceptionId.filter((id) => id !== medecinId)
        : [...regle.medecinsExceptionId, medecinId],
    });
  }

  async function enregistrer() {
    setEnvoi(true);
    setSucces(false);
    const res = await fetch("/api/priorites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regles }),
    });
    setEnvoi(false);
    if (res.ok) {
      setSucces(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {regles.map((r, index) => {
          const ouverte = exceptionsOuvertes.has(r.id);
          return (
            <li key={r.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-900 disabled:opacity-20"
                    disabled={index === 0}
                    onClick={() => deplacer(index, -1)}
                    aria-label="Monter"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-900 disabled:opacity-20"
                    disabled={index === regles.length - 1}
                    onClick={() => deplacer(index, 1)}
                    aria-label="Descendre"
                  >
                    ▼
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 mr-2">#{index + 1}</span>
                      <span className="font-medium">
                        {REGLE_PRIORITE_LABELS[r.cle as CleReglePriorite] ?? r.cle}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={r.actif}
                        onChange={(e) => mettreAJour(r.id, { actif: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {REGLE_PRIORITE_DESCRIPTIONS[r.cle as CleReglePriorite]}
                  </p>

                  <button
                    type="button"
                    className="text-xs text-slate-500 underline mt-2"
                    onClick={() =>
                      setExceptionsOuvertes((prev) => {
                        const copie = new Set(prev);
                        if (copie.has(r.id)) copie.delete(r.id);
                        else copie.add(r.id);
                        return copie;
                      })
                    }
                  >
                    {ouverte ? "Masquer les exceptions" : "Gérer les exceptions"}
                  </button>

                  {ouverte && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={r.exceptionGenerale}
                          onChange={(e) =>
                            mettreAJour(r.id, { exceptionGenerale: e.target.checked })
                          }
                        />
                        Autoriser une exception pour l&apos;ensemble des médecins (le moteur répartit lui-même)
                      </label>
                      {!r.exceptionGenerale && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Ou pour des médecins précis seulement :
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {medecins.map((m) => (
                              <label key={m.id} className="flex items-center gap-1.5 text-sm">
                                <input
                                  type="checkbox"
                                  checked={r.medecinsExceptionId.includes(m.id)}
                                  onChange={() => basculerMedecinException(r, m.id)}
                                />
                                {m.nom}
                              </label>
                            ))}
                            {medecins.length === 0 && (
                              <span className="text-xs text-slate-400">Aucun médecin actif.</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={enregistrer} disabled={envoi}>
          {envoi ? "Enregistrement…" : "Enregistrer l'ordre et les exceptions"}
        </button>
        {succes && <span className="text-sm text-emerald-700">Enregistré.</span>}
      </div>
    </div>
  );
}
