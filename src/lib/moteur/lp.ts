// Petit constructeur de modele au format LP (CPLEX LP), tel qu'attendu par le
// solveur HiGHS (voir https://www.npmjs.com/package/highs). On accumule les
// termes de l'objectif et les contraintes sous forme de texte : suffisant
// pour un modele genere par programme, sans dependre d'une API plus lourde.

export type Terme = { coefficient: number; variable: string };

function formaterTermes(termes: Terme[]): string {
  if (termes.length === 0) return "0";
  return termes
    .map(({ coefficient, variable }, i) => {
      const signe = coefficient < 0 ? "-" : i === 0 ? "" : "+";
      const abs = Math.abs(coefficient);
      const coeffTexte = abs === 1 ? "" : `${formaterNombre(abs)} `;
      return `${signe} ${coeffTexte}${variable}`;
    })
    .join(" ")
    .trim();
}

function formaterNombre(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(6);
}

export class ModeleLP {
  private objectif: Terme[] = [];
  private contraintes: string[] = [];
  private binaires = new Set<string>();
  private compteurContrainte = 0;

  ajouterAuxObjectif(variable: string, coefficient: number) {
    if (coefficient === 0) return;
    this.objectif.push({ coefficient, variable });
  }

  declarerBinaire(variable: string) {
    this.binaires.add(variable);
  }

  // Les variables continues (variables d'ecart, etc.) n'ont besoin d'aucune
  // declaration : en format LP, une variable non listee dans Binaries/Bounds
  // est continue avec bornes par defaut [0, +inf).

  // expr <= | >= | = valeur
  ajouterContrainte(
    termes: Terme[],
    relation: "<=" | ">=" | "=",
    valeur: number,
    nom?: string,
  ) {
    this.compteurContrainte += 1;
    const label = nom ?? `c${this.compteurContrainte}`;
    this.contraintes.push(`${label}: ${formaterTermes(termes)} ${relation} ${formaterNombre(valeur)}`);
  }

  get nombreContraintes() {
    return this.compteurContrainte;
  }

  construire(): string {
    const lignes: string[] = [];
    lignes.push("Minimize");
    lignes.push(` obj: ${formaterTermes(this.objectif)}`);
    lignes.push("Subject To");
    for (const c of this.contraintes) lignes.push(` ${c}`);
    if (this.binaires.size > 0) {
      lignes.push("Binaries");
      lignes.push(` ${[...this.binaires].join(" ")}`);
    }
    lignes.push("End");
    return lignes.join("\n");
  }
}

export function terme(variable: string, coefficient = 1): Terme {
  return { variable, coefficient };
}
