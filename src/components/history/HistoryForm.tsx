"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

type Props = { lang: Locale; t: Dictionary["history"]; initialValue?: string };

export function HistoryForm({ lang, t, initialValue = "" }: Props) {
  const router = useRouter();
  const { address } = useWallet();
  const [value, setValue] = useState(initialValue);
  const [invalid, setInvalid] = useState(false);

  const open = (wallet: string) => router.push(`/${lang}/history/${wallet}`);

  function submit(event: FormEvent) {
    event.preventDefault();
    const wallet = value.trim();
    if (!BASE58_ADDRESS.test(wallet)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    open(wallet);
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="field" style={{ flex: "1 1 320px" }}>
        <label htmlFor="wallet">{t.label}</label>
        <input
          id="wallet"
          className="input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t.placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? "wallet-error" : undefined}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        {t.submit}
      </button>
      {address && address !== initialValue && (
        <button type="button" className="btn btn-secondary" onClick={() => open(address)}>
          {t.useMine}
        </button>
      )}
      {invalid && (
        <p id="wallet-error" className="field-error" role="alert" style={{ flexBasis: "100%" }}>
          {t.invalid}
        </p>
      )}
    </form>
  );
}
