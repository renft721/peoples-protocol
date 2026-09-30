import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnderConstruction } from "@/components/UnderConstruction";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/generate">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).nav.generate };
}

// Generar prueba (DESIGN.md §6.2) — se construye en la Fase 2.
export default async function GeneratePage({ params }: PageProps<"/[lang]/generate">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return <UnderConstruction lang={lang} title={t.nav.generate} t={t.placeholder} />;
}
