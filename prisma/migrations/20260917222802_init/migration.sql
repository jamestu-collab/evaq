-- CreateTable
CREATE TABLE "Medecin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "statutMds" TEXT NOT NULL DEFAULT 'NON_MDS',
    "couvreQuebec" BOOLEAN NOT NULL DEFAULT false,
    "couvreMontreal" BOOLEAN NOT NULL DEFAULT false,
    "minGardesMois" INTEGER,
    "minGardesSemestre" INTEGER,
    "maxGardesSemaine" INTEGER NOT NULL DEFAULT 4,
    "maxGardesMois" INTEGER NOT NULL DEFAULT 8,
    "maxGardesSemestre" INTEGER,
    "preferenceQuartsConsecutifs" TEXT NOT NULL DEFAULT 'PEU_IMPORTE',
    "maxQuartsConsecutifs" INTEGER,
    "resideHorsQuebec" BOOLEAN NOT NULL DEFAULT false,
    "nbQuartsWeekendDesire" INTEGER,
    "proportionAdditionnelleWeekend" REAL,
    "commentaires" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DerogationAdministrative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medecinId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "valeur" INTEGER NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME,
    "motif" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DerogationAdministrative_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormulaireSoumis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomFichier" TEXT NOT NULL,
    "typeMime" TEXT NOT NULL,
    "contenuFichier" BLOB NOT NULL,
    "soumisLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "medecinId" TEXT,
    "nomDetecte" TEXT,
    "extractionIA" JSONB NOT NULL,
    "donneesValidees" JSONB,
    "erreurExtraction" TEXT,
    "valideLe" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormulaireSoumis_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Medecin_actif_idx" ON "Medecin"("actif");

-- CreateIndex
CREATE INDEX "Medecin_nom_idx" ON "Medecin"("nom");

-- CreateIndex
CREATE INDEX "DerogationAdministrative_medecinId_idx" ON "DerogationAdministrative"("medecinId");

-- CreateIndex
CREATE INDEX "FormulaireSoumis_medecinId_idx" ON "FormulaireSoumis"("medecinId");

-- CreateIndex
CREATE INDEX "FormulaireSoumis_statut_idx" ON "FormulaireSoumis"("statut");
