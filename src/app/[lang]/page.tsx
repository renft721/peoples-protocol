import Link from "next/link";
import { notFound } from "next/navigation";
import { VerifiedBadge } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { fill, formatAmount } from "@/lib/format";
import { EXAMPLE_PROOF, exampleProofPath } from "@/protocol/config";
import styles from "./home.module.css";

// Inicio (DESIGN.md §6.1): titular con certificado de ejemplo, cuatro pasos,
// Para instituciones, Niveles de confianza y Ayuda (secciones de esta misma página en el piloto).
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const h = t.home;

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className="eyebrow">{h.eyebrow}</span>
          <h1 className={styles.title}>{h.title}</h1>
          <p className={styles.lead}>{h.lead}</p>
          <div className={styles.actions}>
            <Link href={`/${lang}/generate`} className="btn btn-primary">
              {h.ctaGenerate}
            </Link>
            <Link href={`/${lang}/verify`} className="btn btn-secondary">
              {h.ctaVerify}
            </Link>
          </div>
        </div>

        {/* Certificado de ejemplo: es una prueba real en devnet, con datos de ejemplo de la AEAT. */}
        <div className="certificate">
          <div className={`certificate-inner ${styles.exampleInner}`}>
            <span className="eyebrow" style={{ fontSize: 13, letterSpacing: "0.12em" }}>
              {t.certificate.eyebrowExample}
            </span>
            <p className={styles.exampleTitle}>{fill(h.exampleTitle, { amount: formatAmount(lang, EXAMPLE_PROOF.amount) })}</p>
            <p className="muted">{h.exampleBody}</p>
            <div className={styles.exampleFooter}>
              <VerifiedBadge label={t.common.verifiedBadge} />
              <Link className="link" href={exampleProofPath(lang)}>
                {h.exampleOpen}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.steps} aria-label={h.ctaGenerate}>
        <ol className={styles.stepList}>
          {h.steps.map((step, index) => (
            <li key={step.title} className="card">
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <h2 className={styles.cardTitle}>{step.title}</h2>
              <p className={styles.cardBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="institutions" className={`section ${styles.anchor}`} aria-labelledby="institutions-title">
        <div className="section-head">
          <span className="eyebrow">{h.institutions.eyebrow}</span>
          <h2 id="institutions-title">{h.institutions.title}</h2>
          <p>{h.institutions.lead}</p>
        </div>
        <ul className={styles.threeCols}>
          {h.institutions.layers.map((layer) => (
            <li key={layer.title} className="card">
              <h3 className={styles.cardTitle}>{layer.title}</h3>
              <p className={styles.cardBody}>{layer.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="trust" className={`section ${styles.anchor}`} aria-labelledby="trust-title">
        <div className="section-head">
          <span className="eyebrow">{h.trust.eyebrow}</span>
          <h2 id="trust-title">{h.trust.title}</h2>
          <p>{h.trust.lead}</p>
        </div>
        <ul className={styles.threeCols}>
          {h.trust.sources.map((source) => (
            <li key={source.name} className="card">
              <div className={styles.sourceHead}>
                <h3 className={styles.cardTitle}>{source.name}</h3>
                {source.available ? <VerifiedBadge label={source.status} /> : <span className="badge-caution">{source.status}</span>}
              </div>
              <div className="notice" style={{ marginTop: 14 }}>
                <p className={styles.cardBody} style={{ color: "var(--texto)" }}>
                  {source.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.note}>{h.trust.withdrawal}</p>
      </section>

      <section id="help" className={`section ${styles.anchor} ${styles.last}`} aria-labelledby="help-title">
        <div className="section-head">
          <span className="eyebrow">{h.help.eyebrow}</span>
          <h2 id="help-title">{h.help.title}</h2>
        </div>
        <div className={styles.faq}>
          {h.help.items.map((item) => (
            <details key={item.q} className="disclosure">
              <summary>{item.q}</summary>
              <p className={styles.cardBody} style={{ paddingBottom: 12 }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
