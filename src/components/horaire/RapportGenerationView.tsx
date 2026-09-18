import { RAISON_BLOCAGE_LABELS, type RaisonBlocage } from "@/lib/moteur/raisonsBlocage";
import type { RapportGeneration } from "@/lib/moteur/generer";

export default function RapportGenerationView({ rapport }: { rapport: RapportGeneration }) {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-6">
        <div>
          <div className="text-2xl font-semibold">
            {rapport.nbQuartsCombles} / {rapport.nbQuartsTotal}
          </div>
          <div className="text-xs text-slate-500">quarts comblés</div>
        </div>
        <div className="text-xs text-slate-400">Statut du solveur : {rapport.statutSolveur}</div>
      </div>

      {rapport.quartsNonCombles.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Quarts non comblés ({rapport.quartsNonCombles.length})
          </h3>
          <ul className="divide-y divide-slate-100">
            {rapport.quartsNonCombles.map((q) => (
              <li key={q.date} className="py-2 text-sm">
                <span className="font-medium">{q.date}</span>{" "}
                <span className="text-slate-500">
                  —{" "}
                  {q.raisons
                    .map(
                      (r) =>
                        `${r.nombre} médecin${r.nombre > 1 ? "s" : ""} ${RAISON_BLOCAGE_LABELS[r.raison as RaisonBlocage]}`,
                    )
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card overflow-hidden">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide px-4 pt-4">
          Statistiques par médecin
        </h3>
        <table className="w-full text-sm mt-2">
          <thead className="bg-slate-50 border-y border-slate-200 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Médecin</th>
              <th className="px-4 py-2 font-medium">Gardes</th>
              <th className="px-4 py-2 font-medium">% fins de semaine</th>
              <th className="px-4 py-2 font-medium">Règles assouplies</th>
            </tr>
          </thead>
          <tbody>
            {rapport.statistiques.map((s) => (
              <tr key={s.medecinId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium">{s.nom}</td>
                <td className="px-4 py-2">{s.gardesAssignees}</td>
                <td className="px-4 py-2">{Math.round(s.proportionWeekend * 100)} %</td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {s.reglesAssouplies.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5">
                      {s.reglesAssouplies.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-emerald-700">Aucune</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
