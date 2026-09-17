function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/dr\.?|dre\.?/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distanceLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cout,
      );
    }
  }
  return dp[m][n];
}

/** Score de similarité entre 0 (aucune ressemblance) et 1 (identique). */
export function scoreSimilariteNoms(nomA: string, nomB: string): number {
  const a = normaliser(nomA);
  const b = normaliser(nomB);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const tokensA = new Set(a.split(" "));
  const tokensB = new Set(b.split(" "));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  const scoreTokens = union === 0 ? 0 : intersection / union;

  const maxLen = Math.max(a.length, b.length);
  const scoreLevenshtein =
    maxLen === 0 ? 0 : 1 - distanceLevenshtein(a, b) / maxLen;

  return Math.max(scoreTokens, scoreLevenshtein);
}

export function meilleureCorrespondance<T>(
  nomCible: string,
  candidats: T[],
  extraireNom: (item: T) => string,
): { item: T; score: number } | null {
  let meilleur: { item: T; score: number } | null = null;
  for (const candidat of candidats) {
    const score = scoreSimilariteNoms(nomCible, extraireNom(candidat));
    if (!meilleur || score > meilleur.score) {
      meilleur = { item: candidat, score };
    }
  }
  return meilleur;
}
