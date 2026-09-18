-- CreateTable
CREATE TABLE "Indisponibilite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medecinId" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'DECLAREE',
    "motif" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Indisponibilite_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TypeQuart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "base" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ParametresHoraire" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assignation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "base" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "typeQuartId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'GENERE',
    "verrouille" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignation_typeQuartId_fkey" FOREIGN KEY ("typeQuartId") REFERENCES "TypeQuart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignation_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReglePriorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "exceptionGenerale" BOOLEAN NOT NULL DEFAULT false,
    "medecinsExceptionId" JSONB NOT NULL DEFAULT [],
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Indisponibilite_medecinId_idx" ON "Indisponibilite"("medecinId");

-- CreateIndex
CREATE INDEX "TypeQuart_base_idx" ON "TypeQuart"("base");

-- CreateIndex
CREATE INDEX "Assignation_medecinId_idx" ON "Assignation"("medecinId");

-- CreateIndex
CREATE INDEX "Assignation_date_idx" ON "Assignation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Assignation_base_date_typeQuartId_key" ON "Assignation"("base", "date", "typeQuartId");

-- CreateIndex
CREATE UNIQUE INDEX "ReglePriorite_cle_key" ON "ReglePriorite"("cle");
