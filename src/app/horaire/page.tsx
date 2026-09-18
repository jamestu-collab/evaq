import { prisma } from "@/lib/prisma";
import HoraireManager from "@/components/horaire/HoraireManager";

export const dynamic = "force-dynamic";

export default async function HorairePage() {
  const parametres = await prisma.parametresHoraire.findUnique({ where: { id: "singleton" } });
  const medecins = await prisma.medecin.findMany({
    where: { actif: true, OR: [{ couvreQuebec: true }, { couvreMontreal: true }] },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, couvreQuebec: true, couvreMontreal: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          Génère l&apos;horaire pour la période choisie, réserve des quarts à l&apos;avance, ou ajuste manuellement une affectation.
        </p>
      </div>
      <HoraireManager
        parametresHoraire={
          parametres
            ? {
                dateDebut: parametres.dateDebut.toISOString().slice(0, 10),
                dateFin: parametres.dateFin.toISOString().slice(0, 10),
              }
            : null
        }
        medecins={medecins}
      />
    </div>
  );
}
