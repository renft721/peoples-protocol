import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import styles from "./home.module.css";

// Inicio (DESIGN.md §6.1). Fase 0: titular y cuatro pasos.
// El certificado de ejemplo, "Para instituciones", "Niveles de confianza" y "Ayuda" llegan en la Fase 2.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className="eyebrow">{t.home.eyebrow}</span>
          <h1 className={styles.title}>{t.home.title}</h1>
          <p className={styles.lead}>{t.home.lead}</p>
          <div className={styles.actions}>
            <Link href={`/${lang}/generate`} className="btn btn-primary">
              {t.home.ctaGenerate}
            </Link>
            <Link href={`/${lang}/verify`} className="btn btn-secondary">
              {t.home.ctaVerify}
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.steps}>
        <ol className={styles.stepList}>
          {t.home.steps.map((step, index) => (
            <li key={step.title} className="card">
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <h2 className={styles.stepTitle}>{step.title}</h2>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
