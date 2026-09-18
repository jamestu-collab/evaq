import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assurerReglesPrioriteParDefaut } from "@/lib/moteur/donnees";

export async function GET() {
  const regles = await assurerReglesPrioriteParDefaut();
  return NextResponse.json({ regles: [...regles].sort((a, b) => a.ordre - b.ordre) });
}

const Schema = z.object({
  regles: z.array(
    z.object({
      id: z.string(),
      ordre: z.number().int(),
      actif: z.boolean(),
      exceptionGenerale: z.boolean(),
      medecinsExceptionId: z.array(z.string()),
    }),
  ),
});

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Validation échouée", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    parsed.data.regles.map((r) =>
      prisma.reglePriorite.update({
        where: { id: r.id },
        data: {
          ordre: r.ordre,
          actif: r.actif,
          exceptionGenerale: r.exceptionGenerale,
          medecinsExceptionId: r.medecinsExceptionId,
        },
      }),
    ),
  );

  const regles = await prisma.reglePriorite.findMany({ orderBy: { ordre: "asc" } });
  return NextResponse.json({ regles });
}
