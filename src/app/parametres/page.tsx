import { prisma } from "@/lib/prisma";
import ParametresHoraireForm from "@/components/parametres/ParametresHoraireForm";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const parametres = await prisma.parametresHoraire.findUnique({ where: { id: "singleton" } });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">Paramètres de l&apos;horaire</h1>
        <p className="text-sm text-slate-500">
          Définit la période couverte par défaut (ex. les dates de début et de fin du semestre). Cette période préremplit le formulaire de génération sur la page Horaire — tu peux toujours générer une sous-période différente au besoin.
        </p>
      </div>
      <div className="card p-6">
        <ParametresHoraireForm
          parametres={
            parametres
              ? {
                  dateDebut: parametres.dateDebut.toISOString().slice(0, 10),
                  dateFin: parametres.dateFin.toISOString().slice(0, 10),
                }
              : null
          }
        />
      </div>
    </div>
  );
}
