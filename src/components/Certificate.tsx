// Certificado de una prueba (DESIGN.md §6.3): marco doble, cuatro datos, qué se demuestra,
// recorrido, nivel de confianza y, si hay enlace completo, si sus datos cuadran con la huella.
import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { CheckIcon, Notice, VerifiedBadge } from "./ui";

export type EvidenceState = "match" | "mismatch" | "absent";

export type CertificateField = { label: string; value: string; note?: string };

export type CertificateModel = {
  eyebrow: string;
  title: string;
  /** Los cuatro datos de la fila central (importe, concepto, fecha/mes, emisor). */
  fields: CertificateField[];
  /** "Qué se demuestra": afirmaciones con check. */
  claims: string[];
  /** Recorrido de la prueba, ya con fechas rellenas. */
  trail: string[];
  /** Nivel de confianza (DESIGN.md §8): una o varias frases según el origen. */
  trust: string[];
  /** Aviso sobre la evidencia del enlace; null si no aplica (ejemplo, o prueba sin factura). */
  evidence: EvidenceState | null;
  technical?: { address: string; credential: string; schema: string; signer: string; commitment: string; holder: string };
};

type Props = {
  model: CertificateModel;
  t: Pick<Dictionary, "certificate" | "common">;
  actions?: ReactNode;
  /** Nivel del título: h1 si el certificado es la página, h2 si va dentro de otra. */
  titleLevel?: 1 | 2;
};

export function Certificate({ model, t, actions, titleLevel = 2 }: Props) {
  const c = t.certificate;
  const Title = titleLevel === 1 ? "h1" : "h2";

  return (
    <article className="certificate">
      <div className="certificate-inner">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="eyebrow" style={{ fontSize: 13, letterSpacing: "0.12em" }}>
              {model.eyebrow}
            </span>
            <Title style={{ fontSize: 28, lineHeight: 1.2 }}>{model.title}</Title>
            <span style={{ fontSize: 14, color: "var(--texto-tenue)" }}>{t.common.demoData}</span>
          </div>
          <VerifiedBadge label={t.common.verifiedBadge} />
        </header>

        <dl className="data-grid">
          {model.fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>
                {field.value}
                {field.note && <small>{field.note}</small>}
              </dd>
            </div>
          ))}
        </dl>

        {model.evidence && (
          <Notice
            tone={model.evidence === "match" ? "ok" : model.evidence === "mismatch" ? "warning" : "plain"}
            title={c.evidence[model.evidence]}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: 18 }}>{c.claimsTitle}</h3>
              <ul className="check-list">
                {model.claims.map((claim) => (
                  <li key={claim}>
                    <CheckIcon />
                    {claim}
                  </li>
                ))}
              </ul>
            </section>
            <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 18 }}>{c.trailTitle}</h3>
              <ol className="dot-list">
                {model.trail.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>
          <div style={{ alignSelf: "flex-start" }}>
            <Notice title={c.trustTitle}>
              {model.trust.map((line) => (
                <p key={line} style={{ fontSize: 15, lineHeight: 1.55 }}>
                  {line}
                </p>
              ))}
            </Notice>
          </div>
        </div>

        {actions && <div className="actions-row">{actions}</div>}

        {model.technical && (
          <details className="disclosure">
            <summary>{c.technical.title}</summary>
            <dl className="tech-list">
              <dt>{c.technical.address}</dt>
              <dd className="mono">{model.technical.address}</dd>
              <dt>{c.technical.credential}</dt>
              <dd className="mono">{model.technical.credential}</dd>
              <dt>{c.technical.schema}</dt>
              <dd className="mono">{model.technical.schema}</dd>
              <dt>{c.technical.signer}</dt>
              <dd className="mono">{model.technical.signer}</dd>
              <dt>{c.technical.commitment}</dt>
              <dd className="mono">{model.technical.commitment}</dd>
              <dt>{c.technical.holder}</dt>
              <dd className="mono">{model.technical.holder || c.technical.none}</dd>
            </dl>
          </details>
        )}
      </div>
    </article>
  );
}
