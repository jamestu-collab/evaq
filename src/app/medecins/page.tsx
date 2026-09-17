import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUT_MDS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MedecinsPage() {
  const medecins = await prisma.medecin.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    include: { _count: { select: { formulaires: true } } },
  });

  const sansFormulaire = medecins.filter((m) => m._count.formulaires === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Médecins</h1>
          <p className="text-sm text-slate-500">
            {medecins.length} médecin{medecins.length > 1 ? "s" : ""} actif
            {medecins.length > 1 ? "s" : ""}
            {sansFormulaire.length > 0 && (
              <>
                {" · "}
                <span className="text-amber-600 font-medium">
                  {sansFormulaire.length} sans formulaire soumis
                </span>
              </>
            )}
          </p>
        </div>
        <Link href="/medecins/nouveau" className="btn-primary">
          + Ajouter un médecin
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Bases</th>
              <th className="px-4 py-2 font-medium">Min/Max mois</th>
              <th className="px-4 py-2 font-medium">Formulaires</th>
            </tr>
          </thead>
          <tbody>
            {medecins.map((m) => (
              <tr
                key={m.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/medecins/${m.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {m.nom}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {STATUT_MDS_LABELS[m.statutMds as keyof typeof STATUT_MDS_LABELS] ?? m.statutMds}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {[m.couvreQuebec && "Québec", m.couvreMontreal && "Montréal"]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {m.minGardesMois ?? "—"} / {m.maxGardesMois}
                </td>
                <td className="px-4 py-2">
                  {m._count.formulaires === 0 ? (
                    <span className="badge bg-amber-100 text-amber-800">
                      Aucun formulaire
                    </span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-700">
                      {m._count.formulaires}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {medecins.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucun médecin. Ajoutez-en un pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
