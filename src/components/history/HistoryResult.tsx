"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckIcon, Loading, Notice, VerifiedBadge } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fill, formatPeriod, formatTimestamp } from "@/lib/format";
import { explorerUrl } from "@/protocol/config";
import type { HistoryResult as HistoryResponse } from "@/protocol/history";
import type { PublicAttestation } from "@/protocol/read";
import styles from "./HistoryResult.module.css";

type View = { kind: "loading" } | { kind: "ok"; items: PublicAttestation[] } | { kind: "invalid" } | { kind: "error" };

type Props = { lang: Locale; wallet: string; t: Pick<Dictionary, "history" | "verify" | "certificate" | "common"> };

export function HistoryResult({ lang, wallet, t }: Props) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const h = t.history;

  const load = useCallback(async () => {
    setView({ kind: "loading" });
    try {
      const response = await fetch(`/api/holders/${encodeURIComponent(wallet)}`, { cache: "no-store" });
      const result = (await response.json()) as HistoryResponse | { status: "network_error" };
      if (result.status === "ok") setView({ kind: "ok", items: result.attestations });
      else if (result.status === "invalid_address") setView({ kind: "invalid" });
      else setView({ kind: "error" });
    } catch {
      setView({ kind: "error" });
    }
  }, [wallet]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  if (view.kind === "loading") return <Loading label={h.loading} />;

  if (view.kind === "invalid") {
    return <Notice title={h.invalid} headingLevel={2} />;
  }

  if (view.kind === "error") {
    return (
      <Notice title={t.verify.errorTitle} headingLevel={2} alert>
        <p>{t.verify.errorBody}</p>
        <div>
          <button type="button" className="btn btn-secondary btn-compact" onClick={() => void load()}>
            {t.common.retry}
          </button>
        </div>
      </Notice>
    );
  }

  const items = view.items;
  if (items.length === 0) {
    return (
      <Notice title={h.emptyTitle} tone="plain" headingLevel={2}>
        <p>{h.emptyBody}</p>
      </Notice>
    );
  }

  // Lista ordenada de más reciente a más antigua: el rango va del último al primero.
  const newest = formatPeriod(lang, items[0].period);
  const oldest = formatPeriod(lang, items[items.length - 1].period);
  const summary =
    items.length === 1
      ? fill(h.summaryOne, { period: newest })
      : fill(h.summaryMany, { count: String(items.length), from: oldest, to: newest });
  const isAeat = (item: PublicAttestation) => item.evidenceSource.startsWith("verifactu-aeat");
  const aeatCount = items.filter(isAeat).length;
  const statementCount = items.length - aeatCount;

  return (
    <div className={styles.wrap}>
      <div className="certificate">
        <div className={`certificate-inner ${styles.summary}`}>
          <p className={styles.summaryText}>{summary}</p>
          {statementCount === 0 ? (
            <p className={styles.summaryAeat}>
              <CheckIcon />
              {items.length === 1 ? h.summaryAeatOne : h.summaryAeat}
            </p>
          ) : (
            <p className={styles.summaryAeat}>{fill(h.summaryMixed, { aeat: String(aeatCount), statement: String(statementCount) })}</p>
          )}
          <p className="muted" style={{ fontSize: 15 }}>
            {h.privacy}
          </p>
        </div>
      </div>

      <section aria-labelledby="proofs-title" className={styles.list}>
        <h2 id="proofs-title" className={styles.listTitle}>
          {h.listTitle}
        </h2>
        <ol className={styles.items}>
          {items.map((item) => (
            <li key={item.address} className="card">
              <div className={styles.itemHead}>
                <h3 className={styles.itemTitle}>
                  {fill(t.certificate.title, { concept: t.common.concept[item.eventType], period: formatPeriod(lang, item.period) })}
                </h3>
                <Link className="link" href={`/${lang}/verify/${item.address}`}>
                  {h.viewCertificate}
                </Link>
              </div>
              <p>
                {isAeat(item) ? (
                  <VerifiedBadge label={t.common.trustLevel.aeat} />
                ) : (
                  <span className="badge-caution">{t.common.trustLevel.statement}</span>
                )}
              </p>
              <ul className={styles.claims}>
                {isAeat(item) && (
                  <li>
                    <CheckIcon />
                    {t.certificate.invoiceVerified}
                  </li>
                )}
                {item.paymentConfirmed && (
                  <li>
                    <CheckIcon />
                    {fill(t.certificate.paymentConfirmed, { issuer: t.common.demoIssuer })}
                  </li>
                )}
              </ul>
              <p className={styles.meta}>{fill(h.registeredOn, { date: formatTimestamp(lang, item.issuedAt) })}</p>
            </li>
          ))}
        </ol>
      </section>

      <p>
        <a className="link" href={explorerUrl("address", wallet)} target="_blank" rel="noopener noreferrer">
          {t.common.viewExplorer}
        </a>
      </p>
    </div>
  );
}
