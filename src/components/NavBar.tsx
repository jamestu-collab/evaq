"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/medecins", label: "Médecins" },
  { href: "/ingestion", label: "Ingestion des formulaires" },
];

const LIENS_A_VENIR = ["Priorités", "Horaire", "Demandes"];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-14">
        <span className="font-semibold text-slate-900">TMH · Horaires</span>
        <nav className="flex items-center gap-1">
          {LIENS.map((lien) => {
            const actif = pathname?.startsWith(lien.href);
            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  actif
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {lien.label}
              </Link>
            );
          })}
          {LIENS_A_VENIR.map((label) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded-md text-sm text-slate-300 cursor-not-allowed"
              title="À venir"
            >
              {label}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
