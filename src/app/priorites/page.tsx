import { prisma } from "@/lib/prisma";
import { assurerReglesPrioriteParDefaut } from "@/lib/moteur/donnees";
import PrioritesManager from "@/components/priorites/PrioritesManager";

export const dynamic = "force-dynamic";

export default async function PrioritesPage() {
  await assurerReglesPrioriteParDefaut();
  const regles = await prisma.reglePriorite.findMany({ orderBy: { ordre: "asc" } });
  const medecins = await prisma.medecin.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Priorités du moteur de génération</h1>
        <p className="text-sm text-slate-500">
          Ordonne les règles souples appliquées par le moteur — la plus haute de la liste est respectée en premier. Le respect des indisponibilités déclarées par les médecins reste toujours absolu, avant même ces règles.
        </p>
      </div>
      <PrioritesManager
        reglesInitiales={regles.map((r) => ({
          ...r,
          medecinsExceptionId: Array.isArray(r.medecinsExceptionId)
            ? (r.medecinsExceptionId as string[])
            : [],
        }))}
        medecins={medecins}
      />
    </div>
  );
}
