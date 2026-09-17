"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { TYPES_FICHIERS_ACCEPTES } from "@/lib/constants";

type ResultatUpload = {
  nomFichier: string;
  succes?: boolean;
  ignore?: boolean;
  erreur?: string | null;
  raison?: string;
};

// Cle utilisee pour identifier un fichier deja envoye durant la session en cours
// (nom + taille + date de derniere modification), afin d'eviter les doublons
// lors de la surveillance continue d'un dossier.
function cleFichier(f: File): string {
  return `${f.name}:${f.size}:${f.lastModified}`;
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  }
}

export default function UploadWidget() {
  const router = useRouter();
  const inputFichiersRef = useRef<HTMLInputElement>(null);
  const inputDossierRef = useRef<HTMLInputElement>(null);

  const [enCours, setEnCours] = useState(false);
  const [resultats, setResultats] = useState<ResultatUpload[]>([]);
  const [surveillanceActive, setSurveillanceActive] = useState(false);
  const [erreurSurveillance, setErreurSurveillance] = useState<string | null>(null);

  const fichiersDejaEnvoyes = useRef<Set<string>>(new Set());
  const intervalleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [supportSurveillance, setSupportSurveillance] = useState(false);
  useEffect(() => {
    setSupportSurveillance("showDirectoryPicker" in window);
  }, []);

  const envoyerFichiers = useCallback(
    async (fichiers: File[]) => {
      const aEnvoyer = fichiers.filter((f) => TYPES_FICHIERS_ACCEPTES.includes(f.type));
      if (aEnvoyer.length === 0) return;

      setEnCours(true);
      const formData = new FormData();
      for (const f of aEnvoyer) formData.append("fichiers", f);

      try {
        const res = await fetch("/api/formulaires/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setResultats((prev) => [...(data.resultats ?? []), ...prev]);
          router.refresh();
        } else {
          setResultats((prev) => [
            { nomFichier: "—", succes: false, erreur: data?.erreur ?? "Erreur d'envoi." },
            ...prev,
          ]);
        }
      } finally {
        setEnCours(false);
      }
    },
    [router],
  );

  function surSelectionFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? []);
    for (const f of fichiers) fichiersDejaEnvoyes.current.add(cleFichier(f));
    envoyerFichiers(fichiers);
    e.target.value = "";
  }

  function surDepot(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const fichiers = Array.from(e.dataTransfer.files ?? []);
    for (const f of fichiers) fichiersDejaEnvoyes.current.add(cleFichier(f));
    envoyerFichiers(fichiers);
  }

  async function demarrerSurveillance() {
    setErreurSurveillance(null);
    if (!window.showDirectoryPicker) return;
    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      setSurveillanceActive(true);

      const balayer = async () => {
        const nouveaux: File[] = [];
        for await (const entry of (handle as unknown as {
          values: () => AsyncIterable<FileSystemHandle>;
        }).values()) {
          if (entry.kind !== "file") continue;
          const fileHandle = entry as FileSystemFileHandle;
          const fichier = await fileHandle.getFile();
          const cle = cleFichier(fichier);
          if (!fichiersDejaEnvoyes.current.has(cle)) {
            fichiersDejaEnvoyes.current.add(cle);
            nouveaux.push(fichier);
          }
        }
        if (nouveaux.length > 0) await envoyerFichiers(nouveaux);
      };

      await balayer();
      intervalleRef.current = setInterval(balayer, 15000);
    } catch {
      setErreurSurveillance("Accès au dossier refusé ou annulé.");
    }
  }

  function arreterSurveillance() {
    if (intervalleRef.current) clearInterval(intervalleRef.current);
    intervalleRef.current = null;
    setSurveillanceActive(false);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={surDepot}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center text-sm text-slate-500 bg-white"
      >
        <p className="mb-3">
          Glissez-déposez un ou plusieurs formulaires ici, ou :
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn-secondary" onClick={() => inputFichiersRef.current?.click()}>
            Choisir des fichiers
          </button>
          <button className="btn-secondary" onClick={() => inputDossierRef.current?.click()}>
            Choisir un dossier complet
          </button>
          {supportSurveillance &&
            (surveillanceActive ? (
              <button className="btn-danger" onClick={arreterSurveillance}>
                Arrêter la surveillance
              </button>
            ) : (
              <button className="btn-secondary" onClick={demarrerSurveillance}>
                Surveiller un dossier en continu
              </button>
            ))}
        </div>
        {surveillanceActive && (
          <p className="mt-3 text-xs text-emerald-700">
            Surveillance active — les nouveaux fichiers déposés dans ce dossier seront traités automatiquement tant que cette page reste ouverte.
          </p>
        )}
        {erreurSurveillance && (
          <p className="mt-3 text-xs text-red-600">{erreurSurveillance}</p>
        )}
        {!supportSurveillance && (
          <p className="mt-3 text-xs text-slate-400">
            La surveillance continue d&apos;un dossier requiert un navigateur basé sur Chromium (Chrome, Edge). Utilisez « Choisir un dossier complet » sinon.
          </p>
        )}
        <input
          ref={inputFichiersRef}
          type="file"
          multiple
          accept={TYPES_FICHIERS_ACCEPTES.join(",")}
          className="hidden"
          onChange={surSelectionFichiers}
        />
        <input
          ref={inputDossierRef}
          type="file"
          multiple
          // @ts-expect-error attribut non standard mais largement supporte
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={surSelectionFichiers}
        />
      </div>

      {enCours && <p className="text-sm text-slate-500">Extraction en cours…</p>}

      {resultats.length > 0 && (
        <ul className="text-sm space-y-1">
          {resultats.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={
                  r.ignore
                    ? "text-slate-400"
                    : r.succes
                      ? "text-emerald-700"
                      : "text-red-600"
                }
              >
                {r.ignore ? "⏭" : r.succes ? "✓" : "✗"}
              </span>
              <span>{r.nomFichier}</span>
              {(r.erreur || r.raison) && (
                <span className="text-slate-400">— {r.erreur ?? r.raison}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
