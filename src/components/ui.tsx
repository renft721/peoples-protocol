// Piezas pequeñas de DESIGN.md §4, sin estado: sirven en páginas de servidor y de cliente.
import type { ReactNode } from "react";

export function CheckIcon({ size = 14, color = "var(--verificado-texto)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2.5 7.5l3 3 6-7" />
    </svg>
  );
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="badge-verified">
      <CheckIcon />
      {label}
    </span>
  );
}

type NoticeProps = {
  title: string;
  children?: ReactNode;
  /** warning = aviso (ocre) · ok = verificado (verde) · plain = neutro */
  tone?: "warning" | "ok" | "plain";
  /** role="alert" para errores que aparecen tras una acción */
  alert?: boolean;
  headingLevel?: 2 | 3;
};

export function Notice({ title, children, tone = "warning", alert = false, headingLevel = 3 }: NoticeProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const toneClass = tone === "ok" ? " notice-ok" : tone === "plain" ? " notice-plain" : "";
  return (
    <div className={`notice${toneClass}`} role={alert ? "alert" : undefined}>
      <Heading className="notice-title">{title}</Heading>
      {children}
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <p className="loading-row" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  );
}
