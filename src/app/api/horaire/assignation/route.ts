import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BASE, STATUT_ASSIGNATION } from "@/lib/constants";
import { assurerTypeQuartParDefaut } from "@/lib/moteur/donnees";

const Schema = z.object({
  base: z.enum([BASE.QUEBEC, BASE.MONTREAL]),
  date: z.coerce.date(),
  medecinId: z.string().min(1),
  statut: z.enum([STATUT_ASSIGNATION.MANUEL, STATUT_ASSIGNATION.RESERVE]).default(
    STATUT_ASSIGNATION.MANUEL,
  ),
});

// Cree ou remplace l'affectation d'un quart : utilise a la fois pour la
// modification manuelle d'un quart deja genere et pour la reservation
// prioritaire d'un quart par James avant generation. Dans les deux cas,
// le quart devient verrouille : le moteur ne le remettra plus en cause.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { base, date, medecinId, statut } = parsed.data;
  const typeQuart = await assurerTypeQuartParDefaut(base);

  const assignation = await prisma.assignation.upsert({
    where: { base_date_typeQuartId: { base, date, typeQuartId: typeQuart.id } },
    update: { medecinId, statut, verrouille: true },
    create: { base, date, typeQuartId: typeQuart.id, medecinId, statut, verrouille: true },
  });

  return NextResponse.json({ assignation });
}

const SchemaSuppression = z.object({
  base: z.enum([BASE.QUEBEC, BASE.MONTREAL]),
  date: z.coerce.date(),
});

// Retire l'affectation d'un quart : celui-ci redevient libre (non comble),
// et pourra etre repris par une prochaine generation.
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = SchemaSuppression.safeParse({
    base: searchParams.get("base"),
    date: searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { base, date } = parsed.data;
  const typeQuart = await assurerTypeQuartParDefaut(base);
  await prisma.assignation
    .delete({ where: { base_date_typeQuartId: { base, date, typeQuartId: typeQuart.id } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
