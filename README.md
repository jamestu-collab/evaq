# TMH · Logiciel de gestion des horaires

Application de gestion des horaires du programme TMH/ÉVAQ (bases de Québec et Montréal). Voir le cahier des charges pour le contexte complet.

## État actuel

**Phase 1 — Médecins et ingestion des formulaires**

- **Gestion de la liste des médecins** (`/medecins`) : ajout, modification, retrait de la liste active, dérogations administratives temporaires (min/max personnalisés sur une période).
- **Ingestion des formulaires de disponibilité** (`/ingestion`) : dépôt de fichiers (un par un, par dossier complet, ou par surveillance continue d'un dossier dans Chrome/Edge), extraction automatique des champs par IA (Claude), validation manuelle avant enregistrement dans le profil du médecin, et journal d'audit complet (fichier original consultable, extraction brute, valeur validée).

**Phase 2 — Moteur de génération d'horaire**

- **Génération** (`/horaire`, base de Québec pour l'instant) : construit et résout un modèle d'optimisation (voir *Moteur de génération* ci-dessous), assigne les médecins aux quarts, et produit un rapport (quarts non comblés + raisons probables, statistiques par médecin sur les règles assouplies).
- **Priorités** (`/priorites`) : réordonnancement (flèches, pas encore de glisser-déposer) des règles souples appliquées par le moteur, avec possibilité d'exception générale ou ciblée par médecin.
- **Paramètres** (`/parametres`) : période couverte par défaut (dates de début/fin, ex. un semestre).
- **Indisponibilités** : déclarables directement sur la fiche de chaque médecin (page `/medecins/[id]`) — contrainte absolue pour le moteur.
- **Modification manuelle et réservation prioritaire** : sur `/horaire`, chaque quart peut être réassigné manuellement (verrouille l'affectation pour les générations futures).

**Phase 3 — Base de Montréal**

- `/horaire` permet maintenant de choisir la base (Québec ou Montréal) ; chaque génération tient compte des affectations déjà existantes sur l'autre base pour ne jamais assigner un même médecin aux deux bases la même journée.

Restent à faire : le mode avion-hôpital (quarts multiples, encore à clarifier avec James), le vrai glisser-déposer des priorités, le système de demandes, et les exports (Excel, PDF, liste Mesh AI).

### Simplifications assumées dans le moteur de génération (v1)

Ces choix sont documentés ici pour révision — rien n'est figé, l'onglet Priorités permet déjà d'ajuster une partie de ce comportement :

- Les compteurs hebdomadaires/mensuels sont calculés **uniquement à l'intérieur de la période demandée**. Pour un résultat exact, génère une période complète (un mois ou un semestre entier) plutôt que des fragments qui se chevauchent.
- Seuls samedi/dimanche comptent comme « fin de semaine » — les jours fériés ne sont pas encore modélisés (aucun calendrier de fériés n'existe dans l'application).
- Le plafond de fins de semaine est fixé à 35 % (le cahier des charges mentionne une fourchette de 30–40 %) ; pas encore ajustable dans l'interface.
- Le maximum de gardes (semaine/mois/semestre) est une contrainte absolue ; le minimum est une règle souple (peut céder devant la couverture).
- La préférence de quarts consécutifs est une contrainte absolue pour les médecins hors Québec, souple pour les médecins de la région.

## Démarrage local

Prérequis : Node.js 20+.

```bash
npm install
cp .env.example .env
```

Éditez `.env` et ajoutez votre clé API Anthropic (`ANTHROPIC_API_KEY`), obtenue sur [console.anthropic.com](https://console.anthropic.com/). Sans cette clé, l'application fonctionne normalement mais l'extraction automatique des formulaires échoue (les champs peuvent alors être saisis manuellement sur l'écran de validation).

Initialisez la base de données locale (SQLite) :

```bash
npx prisma migrate deploy
```

Lancez le serveur de développement :

```bash
npm run dev
```

L'application est accessible sur http://localhost:3000.

## Notes techniques

- **Base de données** : SQLite en local (fichier `dev.db` à la racine, ignoré par git), via Prisma ORM 7 avec l'adaptateur `better-sqlite3`. Migration facile vers PostgreSQL plus tard si le volume de données ou le déploiement multi-instance le justifie (changer le `provider` dans `prisma/schema.prisma` et l'adaptateur dans `src/lib/prisma.ts`).
- **Extraction IA** : `src/lib/ai/extraction.ts`, utilise l'API Anthropic (SDK officiel) avec un appel à outil (tool use) pour forcer une réponse structurée. Les PDF et images sont envoyés directement (vision), les `.docx` sont convertis en texte via `mammoth` avant l'envoi.
- **Surveillance continue de dossier** : basée sur la File System Access API du navigateur (`showDirectoryPicker`), disponible uniquement sur Chrome/Edge, et active tant que l'onglet reste ouvert. Alternative universelle : le bouton « Choisir un dossier complet ».
- **Fichiers originaux** : conservés en base de données (colonne `Bytes`) plutôt que sur disque, pour garder un backup unique et cohérent (le fichier `dev.db` contient tout : profils, dérogations, et journal d'audit des formulaires).
- **Moteur de génération** (`src/lib/moteur/`) : modélise chaque génération comme un programme en nombres entiers (variables binaires « médecin X assigné au quart Y »), résolu par [HiGHS](https://highs.dev/) via le paquet `highs` (WebAssembly, tourne directement dans Node — aucun service externe, aucune dépendance Python). Les contraintes absolues (un médecin par quart, maximums, indisponibilités, non-double affectation Québec/Montréal, quarts consécutifs hors Québec) sont codées en dur dans le modèle ; les règles souples sont pondérées selon l'ordre défini dans `/priorites` (poids multipliés par 1000 à chaque rang, pour qu'une règle prioritaire domine toujours la somme des violations des règles en dessous).

## Commandes utiles

```bash
npm run dev      # serveur de développement
npm run build    # build de production
npm run lint     # vérification ESLint
npx prisma studio  # explorateur visuel de la base de données
```
