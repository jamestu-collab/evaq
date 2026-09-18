import { prisma } from "@/lib/prisma";
import {
  BASE,
  HEURE_DEBUT_QUART_DEFAUT,
  HEURE_FIN_QUART_DEFAUT,
  MIN_GARDES_MOIS_DEFAUT,
  type Base,
} from "@/lib/constants";
import { CLES_REGLES_PRIORITE } from "@/lib/constants";
import { dansIntervalle } from "./dates";

export async function assurerTypeQuartParDefaut(base: Base) {
  const existant = await prisma.typeQuart.findFirst({ where: { base, actif: true } });
  if (existant) return existant;
  return prisma.typeQuart.create({
    data: {
      base,
      nom: "Jour",
      heureDebut: HEURE_DEBUT_QUART_DEFAUT,
      heureFin: HEURE_FIN_QUART_DEFAUT,
    },
  });
}

export async function assurerReglesPrioriteParDefaut() {
  const existantes = await prisma.reglePriorite.findMany();
  if (existantes.length >= CLES_REGLES_PRIORITE.length) return existantes;
  const manquantes = CLES_REGLES_PRIORITE.filter(
    (cle) => !existantes.some((r) => r.cle === cle),
  );
  await prisma.$transaction(
    manquantes.map((cle, i) =>
      prisma.reglePriorite.create({
        data: { cle, ordre: existantes.length + i + 1 },
      }),
    ),
  );
  return prisma.reglePriorite.findMany({ orderBy: { ordre: "asc" } });
}

const champBase = (base: Base) => (base === BASE.QUEBEC ? "couvreQuebec" : "couvreMontreal");

export async function chargerContexteGeneration(base: Base, dateDebut: Date, dateFin: Date) {
  const typeQuart = await assurerTypeQuartParDefaut(base);
  await assurerReglesPrioriteParDefaut();

  const medecins = await prisma.medecin.findMany({
    where: { actif: true, [champBase(base)]: true },
    include: { derogations: true },
    orderBy: { nom: "asc" },
  });
  const medecinIds = medecins.map((m) => m.id);

  const indisponibilitesBrutes = await prisma.indisponibilite.findMany({
    where: {
      medecinId: { in: medecinIds },
      dateDebut: { lte: dateFin },
      dateFin: { gte: dateDebut },
    },
  });
  const indisponibilites = new Map<string, { debut: Date; fin: Date }[]>();
  for (const i of indisponibilitesBrutes) {
    const liste = indisponibilites.get(i.medecinId) ?? [];
    liste.push({ debut: i.dateDebut, fin: i.dateFin });
    indisponibilites.set(i.medecinId, liste);
  }

  const assignationsExistantes = await prisma.assignation.findMany({
    where: { base, date: { gte: dateDebut, lte: dateFin } },
  });

  const autreBase = base === BASE.QUEBEC ? BASE.MONTREAL : BASE.QUEBEC;
  const medecinsAutreBase = medecins.filter(
    (m) => m.couvreQuebec && m.couvreMontreal,
  );
  const assignationsAutreBase =
    medecinsAutreBase.length === 0
      ? []
      : await prisma.assignation.findMany({
          where: {
            base: autreBase,
            date: { gte: dateDebut, lte: dateFin },
            medecinId: { in: medecinsAutreBase.map((m) => m.id) },
          },
        });

  const reglesPriorite = await prisma.reglePriorite.findMany({
    where: { cle: { in: [...CLES_REGLES_PRIORITE] } },
    orderBy: { ordre: "asc" },
  });

  return {
    base,
    dateDebut,
    dateFin,
    typeQuart,
    medecins,
    indisponibilites,
    assignationsExistantes,
    assignationsAutreBase,
    reglesPriorite,
  };
}

export type ContexteGeneration = Awaited<ReturnType<typeof chargerContexteGeneration>>;
export type MedecinContexte = ContexteGeneration["medecins"][number];

export function estIndisponible(
  ctx: ContexteGeneration,
  medecinId: string,
  date: Date,
): boolean {
  const periodes = ctx.indisponibilites.get(medecinId);
  if (!periodes) return false;
  return periodes.some((p) => dansIntervalle(date, p.debut, p.fin));
}

// Determine la valeur effective (min ou max) pour un medecin a une date de
// reference donnee, en tenant compte d'une derogation administrative active
// a cette date (voir Medecin.derogations). Simplification assumee : pour un
// meme regroupement (semaine ou mois), on prend la derogation active au
// premier jour du regroupement.
export function plafondEffectif(
  medecin: MedecinContexte,
  type: "MIN_MOIS" | "MAX_SEMAINE" | "MAX_MOIS" | "MIN_SEMESTRE" | "MAX_SEMESTRE",
  dateReference: Date,
): number {
  const derogation = medecin.derogations.find(
    (d) =>
      d.type === type &&
      d.dateDebut <= dateReference &&
      (d.dateFin === null || d.dateFin >= dateReference),
  );
  if (derogation) return derogation.valeur;

  switch (type) {
    case "MIN_MOIS":
      return medecin.minGardesMois ?? MIN_GARDES_MOIS_DEFAUT[medecin.statutMds as "MDS_EXISTANT" | "NON_MDS"] ?? 4;
    case "MAX_SEMAINE":
      return medecin.maxGardesSemaine;
    case "MAX_MOIS":
      return medecin.maxGardesMois;
    case "MIN_SEMESTRE":
      return medecin.minGardesSemestre ?? 0;
    case "MAX_SEMESTRE":
      return medecin.maxGardesSemestre ?? Number.POSITIVE_INFINITY;
  }
}
