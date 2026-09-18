import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

export async function GET() {
  const parametres = await prisma.parametresHoraire.findUnique({ where: { id: SINGLETON_ID } });
  return NextResponse.json({ parametres });
}

const Schema = z.object({
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
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
  if (parsed.data.dateDebut > parsed.data.dateFin) {
    return NextResponse.json(
      { erreur: "La date de début doit précéder la date de fin." },
      { status: 400 },
    );
  }

  const parametres = await prisma.parametresHoraire.upsert({
    where: { id: SINGLETON_ID },
    update: parsed.data,
    create: { id: SINGLETON_ID, ...parsed.data },
  });
  return NextResponse.json({ parametres });
}
