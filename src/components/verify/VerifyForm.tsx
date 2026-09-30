"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const VERIFY_PATH = /\/verify\/([1-9A-HJ-NP-Za-km-z]{32,44})\/?$/;

/** Acepta el identificador suelto o un enlace completo de esta web (con su evidencia detrás de #). */
function toVerifyPath(lang: Locale, input: string): string | null {
  const value = input.trim();
  if (BASE58_ADDRESS.test(value)) return `/${lang}/verify/${value}`;
  try {
    const url = new URL(value);
    const match = VERIFY_PATH.exec(url.pathname);
    if (match) return `/${lang}/verify/${match[1]}${url.hash}`;
  } catch {
    // no es una URL
  }
  return null;
}

type Props = { lang: Locale; t: Dictionary["verify"]; initialValue?: string };

export function VerifyForm({ lang, t, initialValue = "" }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const path = toVerifyPath(lang, value);
    if (!path) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    router.push(path);
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="field" style={{ flex: "1 1 320px" }}>
        <label htmlFor="proof-id">{t.label}</label>
        <input
          id="proof-id"
          className="input"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t.placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? "proof-id-error" : undefined}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        {t.submit}
      </button>
      {invalid && (
        <p id="proof-id-error" className="field-error" role="alert" style={{ flexBasis: "100%" }}>
          {t.invalid}
        </p>
      )}
    </form>
  );
}
