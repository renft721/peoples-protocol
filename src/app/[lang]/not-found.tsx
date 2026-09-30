import Link from "next/link";
import { lang } from "next/root-params";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const current = await lang();
  const locale = hasLocale(current) ? current : defaultLocale;
  const t = await getDictionary(locale);

  return (
    <div className="page page-narrow" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
      <h1 style={{ fontSize: 38 }}>{t.notFound.title}</h1>
      <p style={{ fontSize: 18, color: "var(--texto-suave)" }}>{t.notFound.body}</p>
      <Link href={`/${locale}`} className="btn btn-secondary">
        {t.placeholder.backHome}
      </Link>
    </div>
  );
}
