"use client";

import { useCallback, useEffect, useState } from "react";
import { Certificate, type CertificateModel } from "@/components/Certificate";
import { CopyButton } from "@/components/CopyButton";
import { Loading, Notice } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { buildCertificateModel } from "@/lib/certificate-model";
import { explorerUrl } from "@/protocol/config";
import { evidenceFromHash } from "@/protocol/link";
import type { ReadResult } from "@/protocol/read";

type View =
  | { kind: "loading" }
  | { kind: "found"; model: CertificateModel; explorer: string }
  | { kind: "not_found" }
  | { kind: "closed"; explorer: string }
  | { kind: "foreign" }
  | { kind: "error" };

type Props = { lang: Locale; address: string; t: Pick<Dictionary, "verify" | "certificate" | "common"> };

export function VerifyResult({ lang, address, t }: Props) {
  const [view, setView] = useState<View>({ kind: "loading" });

  const load = useCallback(async () => {
    setView({ kind: "loading" });
    try {
      const response = await fetch(`/api/proofs/${encodeURIComponent(address)}`, { cache: "no-store" });
      const result = (await response.json()) as ReadResult | { status: "network_error" };
      switch (result.status) {
        case "found": {
          // La evidencia se lee del fragmento (#e=…), que nunca se ha enviado al servidor.
          const model = await buildCertificateModel(lang, t, result.attestation, evidenceFromHash(window.location.hash));
          const explorer = explorerUrl(result.attestation.creationSignature ? "tx" : "address", result.attestation.creationSignature ?? address);
          setView({ kind: "found", model, explorer });
          break;
        }
        case "closed":
          setView({ kind: "closed", explorer: explorerUrl("tx", result.lastSignature) });
          break;
        case "foreign":
          setView({ kind: "foreign" });
          break;
        case "invalid_address":
        case "not_found":
          setView({ kind: "not_found" });
          break;
        default:
          setView({ kind: "error" });
      }
    } catch {
      setView({ kind: "error" });
    }
  }, [address, lang, t]);

  useEffect(() => {
    // Primera carga y cada vez que cambie la evidencia del enlace (p. ej. al pegar otro enlace).
    const run = () => void load();
    const initial = setTimeout(run, 0);
    window.addEventListener("hashchange", run);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("hashchange", run);
    };
  }, [load]);

  const v = t.verify;
  return (
    <div aria-live="polite">
      {view.kind === "loading" && <Loading label={v.loading} />}

      {view.kind === "found" && (
        <Certificate
          model={view.model}
          t={t}
          actions={
            <>
              <CopyButton text={() => window.location.href} label={t.common.copyLink} copiedLabel={t.common.copied} />
              <a className="btn btn-secondary btn-compact" href={view.explorer} target="_blank" rel="noopener noreferrer">
                {t.common.viewExplorer}
              </a>
            </>
          }
        />
      )}

      {view.kind === "not_found" && (
        <Notice title={v.notFoundTitle} headingLevel={2}>
          <p>{v.notFoundBody}</p>
        </Notice>
      )}

      {view.kind === "closed" && (
        <Notice title={v.closedTitle} headingLevel={2}>
          <p>{v.closedBody}</p>
          <p>
            <a className="link" href={view.explorer} target="_blank" rel="noopener noreferrer">
              {v.closedLink}
            </a>
          </p>
        </Notice>
      )}

      {view.kind === "foreign" && (
        <Notice title={v.foreignTitle} tone="plain" headingLevel={2}>
          <p>{v.foreignBody}</p>
        </Notice>
      )}

      {view.kind === "error" && (
        <Notice title={v.errorTitle} headingLevel={2} alert>
          <p>{v.errorBody}</p>
          <div>
            <button type="button" className="btn btn-secondary btn-compact" onClick={() => void load()}>
              {t.common.retry}
            </button>
          </div>
        </Notice>
      )}
    </div>
  );
}
