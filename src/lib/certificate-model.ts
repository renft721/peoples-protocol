// Convierte una atestación leída de la cadena (+ la evidencia del enlace, si la hay)
// en lo que muestra el certificado. Funciona en el navegador: la comprobación de la huella
// se hace ahí, con los datos que nunca salen del enlace.
//
// Lo que se enseña depende del origen de la prueba (su nivel de confianza):
// - Factura VeriFactu: importe y fecha (solo si el enlace cuadra con la huella), "factura comprobada
//   por Hacienda" + "pago confirmado por el emisor".
// - Afirmado por el emisor: sin importe ni factura; solo "pago confirmado por el emisor" y el aviso
//   de que no hay comprobación externa.
import type { CertificateModel } from "@/components/Certificate";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fill, formatAmount, formatInvoiceDate, formatPeriod, formatTimestamp } from "@/lib/format";
import { bytesEqual, evidenceCommitment } from "@/protocol/evidence";
import type { Evidence } from "@/protocol/link";
import type { PublicAttestation } from "@/protocol/read";

const hexToBytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16));

export async function buildCertificateModel(
  lang: Locale,
  t: Pick<Dictionary, "certificate" | "common">,
  attestation: PublicAttestation,
  evidence: Evidence | null,
  eyebrow: string = t.certificate.eyebrow,
): Promise<CertificateModel> {
  const c = t.certificate;
  const concept = t.common.concept[attestation.eventType];
  const issuer = t.common.demoIssuer;
  const publishedOn = formatTimestamp(lang, attestation.issuedAt);
  const paymentClaim = attestation.paymentConfirmed ? [fill(c.paymentConfirmed, { issuer })] : [];

  const base = {
    eyebrow,
    title: fill(c.title, { concept, period: formatPeriod(lang, attestation.period) }),
    technical: {
      address: attestation.address,
      credential: attestation.credential,
      schema: attestation.schema,
      signer: attestation.signer,
      commitment: attestation.evidenceCommitment,
      holder: attestation.holder,
    },
  };

  if (attestation.evidenceSource === "issuer-statement") {
    return {
      ...base,
      fields: [
        { label: c.amount, value: c.notIncluded, note: c.notIncludedHint },
        { label: c.concept, value: concept },
        { label: c.month, value: formatPeriod(lang, attestation.period) },
        { label: c.issuer, value: issuer },
      ],
      claims: paymentClaim,
      trail: c.statementTrail.map((step) => fill(step, { date: publishedOn })),
      trust: [c.trust.statement],
      evidence: null,
    };
  }

  // Factura VeriFactu: la evidencia del enlace se contrasta con la huella registrada.
  let state: CertificateModel["evidence"] = "absent";
  if (evidence) {
    const recomputed = await evidenceCommitment(evidence.invoice, evidence.salt);
    state = bytesEqual(recomputed, hexToBytes(attestation.evidenceCommitment)) ? "match" : "mismatch";
  }
  // Solo se enseñan importe y fecha si cuadran con lo registrado: nunca datos que no se han podido comprobar.
  const trusted = state === "match" && evidence ? evidence.invoice : null;
  const hidden = { value: c.hidden, note: c.hiddenHint };

  return {
    ...base,
    fields: [
      { label: c.amount, ...(trusted ? { value: formatAmount(lang, trusted.amount) } : hidden) },
      { label: c.concept, value: concept },
      { label: c.date, ...(trusted ? { value: formatInvoiceDate(lang, trusted.issueDate) } : hidden) },
      { label: c.issuer, value: issuer },
    ],
    claims: [c.invoiceVerified, ...paymentClaim],
    trail: c.trail.map((step) => fill(step, { date: publishedOn })),
    trust: [
      c.trust.verifactu,
      c.trust.payment,
      ...(attestation.evidenceSource === "verifactu-aeat-test" ? [c.trust.testEnvironment] : []),
    ],
    evidence: state,
  };
}
