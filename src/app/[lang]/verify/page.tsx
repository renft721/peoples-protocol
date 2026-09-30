import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerifyForm } from "@/components/verify/VerifyForm";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { exampleProofPath } from "@/protocol/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/verify">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).verify.title };
}

// Comprobar una prueba (DESIGN.md §6.3): formulario. El resultado vive en /verify/[address].
export default async function VerifyPage({ params }: PageProps<"/[lang]/verify">) {
  const { lang } = await params;
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
      <VerifyForm lang={lang} t={t.verify} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Link className="link" href={exampleProofPath(lang)} style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          {t.verify.tryExample}
        </Link>
        <Link className="link" href={`/${lang}/history`} style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          {t.history.verifyHint}
        </Link>
      </div>
    </div>
  );
}
