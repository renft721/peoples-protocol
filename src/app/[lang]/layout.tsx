import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import "../globals.css";

// Fuentes de DESIGN.md §3, servidas desde nuestro propio dominio (next/font las descarga al compilar).
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-serif" });
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

// Solo existen /en y /es: cualquier otro idioma da 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: { default: t.meta.title, template: `%s · ${t.meta.title}` },
    description: t.meta.description,
    alternates: { languages: { en: "/en", es: "/es" } },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const otherLang = lang === "en" ? "es" : "en";

  return (
    <html lang={lang} className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          {t.a11y.skipToContent}
        </a>
        <WalletProvider>
          <SiteHeader
            lang={lang}
            otherLang={otherLang}
            t={{ a11y: t.a11y, nav: t.nav, network: t.network, language: t.language, wallet: t.wallet }}
            historyLabel={t.history.mine}
          />
          <main id="main">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
