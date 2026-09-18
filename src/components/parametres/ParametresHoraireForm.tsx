"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function ParametresHoraireForm({
  parametres,
}: {
  parametres: { dateDebut: string; dateFin: string } | null;
}) {
  const router = useRouter();
  const [dateDebut, setDateDebut] = useState(parametres?.dateDebut ?? "");
  const [dateFin, setDateFin] = useState(parametres?.dateFin ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setSucces(false);
    setEnvoi(true);
    const res = await fetch("/api/parametres-horaire", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateDebut, dateFin }),
    });
    setEnvoi(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.erreur ?? "Erreur lors de l'enregistrement.");
      return;
    }
    setSucces(true);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      {succes && <p className="text-sm text-emerald-700">Paramètres enregistrés.</p>}
      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="block mb-1">Début de la période</span>
          <input
            type="date"
            className="input"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Fin de la période</span>
          <input
            type="date"
            className="input"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            required
          />
        </label>
      </div>
      <button type="submit" className="btn-primary" disabled={envoi}>
        {envoi ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
