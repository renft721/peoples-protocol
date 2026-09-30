import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

// Marcador temporal para las pantallas que se construyen en la Fase 2.
export function UnderConstruction({ lang, title, t }: { lang: Locale; title: string; t: Dictionary["placeholder"] }) {
  return (
    <div className="page page-narrow" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
      <h1 style={{ fontSize: 38 }}>{title}</h1>
      <p style={{ fontSize: 18, color: "var(--texto-suave)" }}>{t.underConstruction}</p>
      <Link href={`/${lang}`} className="btn btn-secondary">
        {t.backHome}
      </Link>
    </div>
  );
}
