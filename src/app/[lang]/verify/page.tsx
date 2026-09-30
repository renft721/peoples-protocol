import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnderConstruction } from "@/components/UnderConstruction";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/verify">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).nav.verify };
}

// Comprobar una prueba (DESIGN.md §6.3) — se construye en la Fase 2.
export default async function VerifyPage({ params }: PageProps<"/[lang]/verify">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return <UnderConstruction lang={lang} title={t.nav.verify} t={t.placeholder} />;
}
