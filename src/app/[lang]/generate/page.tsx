import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GenerateWizard } from "@/components/generate/GenerateWizard";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/generate">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).generate.title };
}

// Generar prueba (DESIGN.md §6.2): asistente de 4 pasos.
export default async function GeneratePage({ params }: PageProps<"/[lang]/generate">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return <GenerateWizard lang={lang} t={{ generate: t.generate, common: t.common }} />;
}
