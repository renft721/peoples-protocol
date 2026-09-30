"use client";

import { useState } from "react";

type Props = { text: string | (() => string); label: string; copiedLabel: string; className?: string };

export function CopyButton({ text, label, copiedLabel, className = "btn btn-secondary btn-compact" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const value = typeof text === "function" ? text() : text;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sin permiso de portapapeles: se muestra el enlace para copiarlo a mano.
      window.prompt(label, value);
    }
  }

  return (
    <button type="button" className={className} onClick={copy}>
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
