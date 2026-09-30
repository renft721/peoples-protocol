import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HistoryForm } from "@/components/history/HistoryForm";
import { HistoryResult } from "@/components/history/HistoryResult";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { fill, shortAddress } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/history/[wallet]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).history.title, robots: { index: false } };
}

// Historial de pagos de una wallet: todas las pruebas del piloto ligadas a ella.
export default async function HolderHistoryPage({ params }: PageProps<"/[lang]/history/[wallet]">) {
  const { lang, wallet } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <div className="page page-narrow" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ fontSize: 38 }}>{t.history.title}</h1>
        <p style={{ fontSize: 18 }} className="muted">
          {fill(t.history.wallet, { address: shortAddress(wallet) })} · {t.history.lead}
        </p>
      </div>
      <HistoryForm key={wallet} lang={lang} t={t.history} initialValue={wallet} />
      <HistoryResult
        lang={lang}
        wallet={wallet}
        t={{ history: t.history, verify: t.verify, certificate: t.certificate, common: t.common }}
      />
    </div>
  );
}
