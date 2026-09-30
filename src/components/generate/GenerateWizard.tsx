"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Loading, Notice } from "@/components/ui";
import { useWallet } from "@/components/wallet/WalletProvider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fill, formatAmount, formatInvoiceDate, formatPeriod, shortAddress } from "@/lib/format";
import type { AeatVerdict } from "@/protocol/aeat";
import { SAMPLE_QR } from "@/protocol/config";
import type { VerifactuInvoice } from "@/protocol/verifactu";
import styles from "./GenerateWizard.module.css";

type Checked = { invoice: VerifactuInvoice; period: string };

type Phase =
  | { kind: "input"; error: string | null }
  | { kind: "checking" }
  | ({ kind: "checked"; verdict: AeatVerdict } & Checked)
  | ({ kind: "registering" } & Checked)
  | { kind: "duplicate"; attestation: string }
  | { kind: "failed"; message: string }
  | { kind: "done"; path: string };

const STEP_OF_PHASE: Record<Phase["kind"], number> = {
  input: 1,
  checking: 2,
  checked: 2,
  registering: 3,
  duplicate: 3,
  failed: 3,
  done: 4,
};

type T = Pick<Dictionary, "generate" | "common" | "history">;

function errorMessage(t: T, code: unknown): string {
  const errors = t.generate.errors as Record<string, string>;
  return (typeof code === "string" && errors[code]) || errors.network;
}

export function GenerateWizard({ lang, t }: { lang: Locale; t: T }) {
  const g = t.generate;
  const { address: holder } = useWallet();
  const [qr, setQr] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "input", error: null });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = STEP_OF_PHASE[phase.kind];

  // Al cambiar de paso, el foco va al título del paso (lectores de pantalla y teclado).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [phase.kind]);

  async function check(event: FormEvent) {
    event.preventDefault();
    if (!qr.trim()) {
      setPhase({ kind: "input", error: g.errors.missing_field });
      return;
    }
    setPhase({ kind: "checking" });
    try {
      const response = await fetch("/api/verifactu/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qr }),
      });
      const body = await response.json();
      if (!response.ok) {
        setPhase({ kind: "input", error: errorMessage(t, body.error) });
        return;
      }
      setPhase({ kind: "checked", verdict: body.verdict, invoice: body.invoice, period: body.period });
    } catch {
      setPhase({ kind: "input", error: g.errors.network });
    }
  }

  async function register({ invoice, period }: Checked) {
    setPhase({ kind: "registering", invoice, period });
    try {
      const response = await fetch("/api/proofs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qr, holder: holder ?? undefined }),
      });
      const body = await response.json();
      if (response.status === 409 && body.status === "duplicate") {
        setPhase({ kind: "duplicate", attestation: body.attestation });
      } else if (!response.ok) {
        setPhase({ kind: "failed", message: errorMessage(t, body.error) });
      } else {
        // La evidencia (#e=…) solo existe aquí y en el enlace: el servidor no la guarda.
        setPhase({ kind: "done", path: `/${lang}/verify/${body.attestation}#e=${body.evidence}` });
      }
    } catch {
      setPhase({ kind: "failed", message: g.errors.network });
    }
  }

  const restart = () => setPhase({ kind: "input", error: null });

  return (
    <div className={styles.layout}>
      <aside className={styles.stepsColumn}>
        <h1 className={styles.title}>{g.title}</h1>
        <p className="visually-hidden" aria-live="polite">
          {fill(g.stepOf, { current: String(step), total: "4" })}: {g.steps[step - 1]}
        </p>
        <ol className={styles.steps}>
          {g.steps.map((label, index) => {
            const n = index + 1;
            const state = n < step ? "done" : n === step ? "active" : "pending";
            return (
              <li key={label} className={styles[state]} aria-current={state === "active" ? "step" : undefined}>
                <span className={styles.stepCircle} aria-hidden="true">
                  {n}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className={`card ${styles.main}`} aria-labelledby="step-heading">
        {phase.kind === "input" && (
          <form onSubmit={check} noValidate className={styles.stack}>
            <div className={styles.stackTight}>
              <h2 id="step-heading" ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
                {g.source.title}
              </h2>
              <p className="muted">{g.source.lead}</p>
            </div>

            <fieldset className={styles.sources}>
              <legend className="visually-hidden">{g.source.title}</legend>
              <label className={`${styles.source} ${styles.sourceDisabled}`}>
                <input type="radio" name="source" value="portal" disabled className="visually-hidden" />
                <span className={styles.sourceTitle}>
                  {g.source.portalTitle} <span className="badge-caution">{t.common.comingSoon}</span>
                </span>
                <span className={styles.sourceBody}>{g.source.portalBody}</span>
                <span className={styles.sourceBody}>{g.source.portalSoon}</span>
              </label>
              <label className={`${styles.source} ${styles.sourceSelected}`}>
                <input type="radio" name="source" value="verifactu" defaultChecked className="visually-hidden" />
                <span className={styles.sourceTitle}>{g.source.verifactuTitle}</span>
                <span className={styles.sourceBody}>{g.source.verifactuBody}</span>
              </label>
            </fieldset>

            <div className="field">
              <label htmlFor="qr">{g.source.qrLabel}</label>
              <input
                id="qr"
                className="input"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder={g.source.qrPlaceholder}
                value={qr}
                onChange={(event) => setQr(event.target.value)}
                aria-invalid={phase.error ? true : undefined}
                aria-describedby={phase.error ? "qr-hint qr-error" : "qr-hint"}
              />
              <p id="qr-hint" className="field-hint">
                {g.source.qrHint}{" "}
                <button type="button" className={styles.inlineButton} onClick={() => setQr(SAMPLE_QR)}>
                  {g.source.useSample}
                </button>
              </p>
              {phase.error && (
                <p id="qr-error" className="field-error" role="alert">
                  {phase.error}
                </p>
              )}
            </div>

            <div className={styles.footer}>
              <button type="submit" className="btn btn-primary">
                {g.source.continue}
              </button>
            </div>
          </form>
        )}

        {phase.kind === "checking" && (
          <div className={styles.stack}>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
              {g.steps[1]}
            </h2>
            <Loading label={g.check.loading} />
          </div>
        )}

        {phase.kind === "checked" && (
          <div className={styles.stack}>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
              {g.steps[1]}
            </h2>
            {phase.verdict.status === "found" ? (
              <>
                <Notice tone="ok" title={g.check.foundTitle}>
                  <p>{g.check.foundBody}</p>
                </Notice>
                <InvoiceSummary lang={lang} t={g.check} invoice={phase.invoice} period={phase.period} />
                <div className={styles.stackTight}>
                  <h3 className={styles.subheading}>{g.check.holderTitle}</h3>
                  <p className="muted">{holder ? fill(g.check.holderConnected, { address: shortAddress(holder) }) : g.check.holderNone}</p>
                </div>
                <div className={styles.footer}>
                  <button type="button" className="btn btn-secondary" onClick={restart}>
                    {t.common.back}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => void register(phase)}>
                    {g.check.register}
                  </button>
                </div>
              </>
            ) : (
              <>
                {phase.verdict.status === "not_found" && (
                  <Notice title={g.check.notFoundTitle}>
                    <p>{g.check.notFoundBody}</p>
                  </Notice>
                )}
                {phase.verdict.status === "rejected" && (
                  <Notice title={g.check.rejectedTitle}>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {phase.verdict.messages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </Notice>
                )}
                {phase.verdict.status === "unrecognized" && (
                  <Notice title={g.check.unrecognizedTitle}>
                    <p>{g.check.unrecognizedBody}</p>
                  </Notice>
                )}
                <div className={styles.footer}>
                  <button type="button" className="btn btn-secondary" onClick={restart}>
                    {t.common.back}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {phase.kind === "registering" && (
          <div className={styles.stack}>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
              {g.steps[2]}
            </h2>
            <InvoiceSummary lang={lang} t={g.check} invoice={phase.invoice} period={phase.period} />
            <Loading label={g.register.loading} />
          </div>
        )}

        {phase.kind === "duplicate" && (
          <div className={styles.stack}>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
              {g.steps[2]}
            </h2>
            <Notice title={g.register.duplicateTitle}>
              <p>{g.register.duplicateBody}</p>
            </Notice>
            <div className={styles.footer}>
              <button type="button" className="btn btn-secondary" onClick={restart}>
                {t.common.back}
              </button>
              <Link className="btn btn-primary" href={`/${lang}/verify/${phase.attestation}`}>
                {g.register.viewExisting}
              </Link>
            </div>
          </div>
        )}

        {phase.kind === "failed" && (
          <div className={styles.stack}>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
              {g.steps[2]}
            </h2>
            <Notice title={g.errors.chain_error} alert>
              <p>{phase.message}</p>
            </Notice>
            <div className={styles.footer}>
              <button type="button" className="btn btn-secondary" onClick={restart}>
                {t.common.back}
              </button>
            </div>
          </div>
        )}

        {phase.kind === "done" && (
          <Done
            lang={lang}
            t={t}
            path={phase.path}
            holder={holder}
            onRestart={() => {
              setQr("");
              restart();
            }}
            headingRef={headingRef}
          />
        )}
      </section>

      <aside className={styles.panels} aria-label={g.panels.sharedTitle}>
        <div className="notice notice-ok">
          <h2 className="notice-title">{g.panels.sharedTitle}</h2>
          <p className={styles.panelText}>{g.panels.shared}</p>
        </div>
        <div className="notice notice-plain">
          <h2 className="notice-title">{g.panels.notSharedTitle}</h2>
          <p className={styles.panelText}>{g.panels.notShared}</p>
        </div>
        <div className="notice notice-plain">
          <h2 className="notice-title">{g.panels.beforeTitle}</h2>
          <p className={styles.panelText}>{g.panels.before}</p>
        </div>
      </aside>
    </div>
  );
}

function InvoiceSummary({ lang, t, invoice, period }: { lang: Locale; t: Dictionary["generate"]["check"]; invoice: VerifactuInvoice; period: string }) {
  return (
    <dl className="data-grid">
      <div>
        <dt>{t.amount}</dt>
        <dd>{formatAmount(lang, invoice.amount)}</dd>
      </div>
      <div>
        <dt>{t.date}</dt>
        <dd>{formatInvoiceDate(lang, invoice.issueDate)}</dd>
      </div>
      <div>
        <dt>{t.number}</dt>
        <dd>{invoice.invoiceNumber}</dd>
      </div>
      <div>
        <dt>{t.issuerNif}</dt>
        <dd>{invoice.issuerNif}</dd>
      </div>
      <div>
        <dt>{t.period}</dt>
        <dd>{formatPeriod(lang, period)}</dd>
      </div>
    </dl>
  );
}

type DoneProps = {
  lang: Locale;
  t: T;
  path: string;
  holder: string | null;
  onRestart: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
};

function Done({ lang, t, path, holder, onRestart, headingRef }: DoneProps) {
  const d = t.generate.done;
  // La URL completa solo se conoce en el navegador (origen + ruta + evidencia).
  const [url, setUrl] = useState(path);
  useEffect(() => {
    const id = setTimeout(() => setUrl(`${window.location.origin}${path}`), 0);
    return () => clearTimeout(id);
  }, [path]);

  return (
    <div className={styles.stack}>
      <h2 id="step-heading" ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
        {d.title}
      </h2>
      <p className="muted">{d.body}</p>
      <div className="field">
        <label htmlFor="proof-link">{d.linkLabel}</label>
        <input id="proof-link" className="input mono" type="text" readOnly value={url} onFocus={(event) => event.target.select()} />
      </div>
      <Notice title={d.saveWarningTitle}>
        <p>{d.saveWarning}</p>
      </Notice>
      {holder && (
        <p>
          <Link className="link" href={`/${lang}/history/${holder}`}>
            {t.history.fromWizard}
          </Link>
        </p>
      )}
      <div className={styles.footer}>
        <button type="button" className="btn btn-secondary" onClick={onRestart}>
          {d.another}
        </button>
        <CopyButton text={url} label={t.common.copyLink} copiedLabel={t.common.copied} className="btn btn-secondary" />
        <Link className="btn btn-primary" href={path} hrefLang={lang}>
          {d.open}
        </Link>
      </div>
    </div>
  );
}
