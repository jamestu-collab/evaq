const JOUR_MS = 24 * 60 * 60 * 1000;

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function enumererDates(debut: Date, fin: Date): Date[] {
  const dates: Date[] = [];
  const courant = new Date(
    Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth(), debut.getUTCDate()),
  );
  const derniere = new Date(
    Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate()),
  );
  while (courant.getTime() <= derniere.getTime()) {
    dates.push(new Date(courant));
    courant.setUTCDate(courant.getUTCDate() + 1);
  }
  return dates;
}

export function estWeekend(d: Date): boolean {
  const jour = d.getUTCDay();
  return jour === 0 || jour === 6;
}

export function cleMois(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Cle "annee-semaine ISO 8601" : la semaine commence le lundi.
export function cleSemaineISO(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const jourISO = (date.getUTCDay() + 6) % 7; // 0 = lundi
  date.setUTCDate(date.getUTCDate() - jourISO + 3); // jeudi de cette semaine
  const premierJeudi = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const semaine =
    1 +
    Math.round(
      ((date.getTime() - premierJeudi.getTime()) / JOUR_MS -
        3 +
        ((premierJeudi.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-S${String(semaine).padStart(2, "0")}`;
}

export function ajouterJours(d: Date, n: number): Date {
  const copie = new Date(d);
  copie.setUTCDate(copie.getUTCDate() + n);
  return copie;
}

export function dansIntervalle(d: Date, debut: Date, fin: Date): boolean {
  return d.getTime() >= debut.getTime() && d.getTime() <= fin.getTime();
}
