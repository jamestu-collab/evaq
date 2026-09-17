# TMH · Logiciel de gestion des horaires

Application de gestion des horaires du programme TMH/ÉVAQ (bases de Québec et Montréal). Voir le cahier des charges pour le contexte complet.

## État actuel (phase 1)

Cette première phase couvre :

- **Gestion de la liste des médecins** (`/medecins`) : ajout, modification, retrait de la liste active, dérogations administratives temporaires (min/max personnalisés sur une période).
- **Ingestion des formulaires de disponibilité** (`/ingestion`) : dépôt de fichiers (un par un, par dossier complet, ou par surveillance continue d'un dossier dans Chrome/Edge), extraction automatique des champs par IA (Claude), validation manuelle avant enregistrement dans le profil du médecin, et journal d'audit complet (fichier original consultable, extraction brute, valeur validée).

Le moteur de génération d'horaire (OR-Tools / CP-SAT), le système de demandes, et les exports (Excel, PDF, Mesh AI) ne sont **pas encore implémentés** — prochaines étapes du projet.

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

## Commandes utiles

```bash
npm run dev      # serveur de développement
npm run build    # build de production
npm run lint     # vérification ESLint
npx prisma studio  # explorateur visuel de la base de données
```
