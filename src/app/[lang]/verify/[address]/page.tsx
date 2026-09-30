import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VerifyForm } from "@/components/verify/VerifyForm";
import { VerifyResult } from "@/components/verify/VerifyResult";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/verify/[address]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  // Sin datos de la prueba en el título: la evidencia del enlace nunca sale del navegador.
  return { title: (await getDictionary(lang)).verify.title, robots: { index: false } };
}

// Resultado de comprobar una prueba. La lectura se hace en el navegador (VerifyResult) para
// poder mostrar los estados de carga y error, y porque la evidencia (#e=…) solo existe ahí.
export default async function VerifyAddressPage({ params }: PageProps<"/[lang]/verify/[address]">) {
  const { lang, address } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <div className="page page-narrow" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ fontSize: 38 }}>{t.verify.title}</h1>
        <p style={{ fontSize: 18 }} className="muted">
          {t.verify.lead}
        </p>
      </div>
      <VerifyForm key={address} lang={lang} t={t.verify} initialValue={address} />
      <VerifyResult lang={lang} address={address} t={{ verify: t.verify, certificate: t.certificate, common: t.common }} />
    </div>
  );
}
