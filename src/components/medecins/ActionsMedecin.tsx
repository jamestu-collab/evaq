"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActionsMedecin({
  medecinId,
  actif,
}: {
  medecinId: string;
  actif: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    if (actif && !confirm("Retirer ce médecin de la liste active ?")) return;
    setEnCours(true);
    await fetch(`/api/medecins/${medecinId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !actif }),
    });
    setEnCours(false);
    router.refresh();
  }

  return (
    <button
      onClick={basculer}
      disabled={enCours}
      className={actif ? "btn-danger" : "btn-secondary"}
    >
      {actif ? "Retirer de la liste active" : "Réactiver"}
    </button>
  );
}
