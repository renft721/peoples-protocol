import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HistoryForm } from "@/components/history/HistoryForm";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/history">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).history.title };
}

// Historial de pagos de un titular: formulario. El resultado vive en /history/[wallet].
export default async function HistoryPage({ params }: PageProps<"/[lang]/history">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <div className="page page-narrow" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ fontSize: 38 }}>{t.history.title}</h1>
        <p style={{ fontSize: 18 }} className="muted">
          {t.history.lead}
        </p>
      </div>
      <HistoryForm lang={lang} t={t.history} />
    </div>
  );
}
