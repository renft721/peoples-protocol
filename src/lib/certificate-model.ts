// Convierte una atestación leída de la cadena (+ la evidencia del enlace, si la hay)
// en lo que muestra el certificado. Funciona en el navegador: la comprobación de la huella
// se hace ahí, con los datos que nunca salen del enlace.
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
  let state: CertificateModel["evidence"] = "absent";
  if (evidence) {
    const recomputed = await evidenceCommitment(evidence.invoice, evidence.salt);
    state = bytesEqual(recomputed, hexToBytes(attestation.evidenceCommitment)) ? "match" : "mismatch";
  }
  // Solo se enseñan importe y fecha si cuadran con lo registrado: nunca datos que no se han podido comprobar.
  const trusted = state === "match" && evidence ? evidence.invoice : null;
  const concept = t.common.concept[attestation.eventType];

  return {
    eyebrow,
    title: fill(t.certificate.title, { concept, period: formatPeriod(lang, attestation.period) }),
    concept,
    issuer: t.common.demoIssuer,
    amount: trusted ? formatAmount(lang, trusted.amount) : null,
    invoiceDate: trusted ? formatInvoiceDate(lang, trusted.issueDate) : null,
    publishedOn: formatTimestamp(lang, attestation.issuedAt),
    source: attestation.evidenceSource,
    paymentConfirmed: attestation.paymentConfirmed,
    evidence: state,
    technical: {
      address: attestation.address,
      credential: attestation.credential,
      schema: attestation.schema,
      signer: attestation.signer,
      commitment: attestation.evidenceCommitment,
      holder: attestation.holder,
    },
  };
}
