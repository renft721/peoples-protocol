"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { LogoMark } from "./Logo";
import { WalletButton } from "./wallet/WalletButton";
import styles from "./SiteHeader.module.css";

type Props = {
  lang: Locale;
  otherLang: Locale;
  t: Pick<Dictionary, "a11y" | "nav" | "network" | "language" | "wallet">;
};

export function SiteHeader({ lang, otherLang, t }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: `/${lang}`, label: t.nav.home, active: pathname === `/${lang}` },
    { href: `/${lang}/generate`, label: t.nav.generate, active: pathname.startsWith(`/${lang}/generate`) },
    { href: `/${lang}/verify`, label: t.nav.verify, active: pathname.startsWith(`/${lang}/verify`) },
    // "Para instituciones" y "Ayuda" son secciones de la página de inicio en el piloto (DESIGN.md §5).
    { href: `/${lang}#institutions`, label: t.nav.institutions, active: false },
    { href: `/${lang}#help`, label: t.nav.help, active: false },
  ];

  // Misma página en el otro idioma: /en/verify ⇄ /es/verify
  const otherLangHref = `/${otherLang}${pathname.slice(`/${lang}`.length)}`;

  const languageLink = (
    <Link href={otherLangHref} hrefLang={otherLang} lang={otherLang} className={styles.language} aria-label={`${t.a11y.changeLanguage}: ${t.language.otherName}`}>
      {t.language.otherName}
    </Link>
  );

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href={`/${lang}`} className={styles.brand} aria-label={t.a11y.home}>
          <LogoMark />
          <span aria-hidden="true">People&apos;s Protocol</span>
        </Link>
        <nav aria-label={t.a11y.mainNav} className={styles.desktopNav}>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={link.active ? styles.active : undefined} aria-current={link.active ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.right}>
        <span className="pill-devnet" title={t.network.devnetTitle}>
          {t.network.devnet}
        </span>
        <span className={styles.desktopOnly}>{languageLink}</span>
        <WalletButton t={t.wallet} className={styles.desktopOnly} />
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? <path d="M5 5l12 12M17 5L5 17" /> : <path d="M3 6h16M3 11h16M3 16h16" />}
          </svg>
          <span className="visually-hidden">{menuOpen ? t.a11y.closeMenu : t.a11y.openMenu}</span>
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label={t.a11y.mainNav} className={styles.mobileNav}>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={link.active ? styles.active : undefined}
                  aria-current={link.active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>{languageLink}</li>
            <li className={styles.mobileWallet}>
              <WalletButton t={t.wallet} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
