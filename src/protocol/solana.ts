// Conexión con Solana devnet y envío de transacciones.

import {
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createTransactionMessage,
  devnet,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Instruction,
  type Signature,
  type TransactionSigner,
} from "@solana/kit";
import { PUBLIC_DEVNET_RPC } from "./config";

const createDevnetRpc = (url: string) => createSolanaRpc(devnet(url));
export type SolanaRpc = ReturnType<typeof createDevnetRpc>;

let cached: SolanaRpc | undefined;

/** RPC de devnet: el de SOLANA_RPC_URL (Helius) si está configurado; si no, el público. */
export function getRpc(): SolanaRpc {
  cached ??= createDevnetRpc(process.env.SOLANA_RPC_URL || PUBLIC_DEVNET_RPC);
  return cached;
}

const POLL_INTERVAL_MS = 1_000;

/**
 * Firma, envía y espera a que la red confirme la transacción.
 * Se comprueba el estado cada segundo en vez de usar websockets, que en las funciones
 * de Vercel pueden cortarse. Se rinde cuando el blockhash caduca (~1 minuto).
 */
export async function sendAndConfirm(
  rpc: SolanaRpc,
  feePayer: TransactionSigner,
  instructions: readonly Instruction[],
): Promise<Signature> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: "confirmed" }).send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(feePayer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m),
  );
  const transaction = await signTransactionMessageWithSigners(message);
  const signature = getSignatureFromTransaction(transaction);

  await rpc
    .sendTransaction(getBase64EncodedWireTransaction(transaction), { encoding: "base64", preflightCommitment: "confirmed" })
    .send();

  for (;;) {
    const { value } = await rpc.getSignatureStatuses([signature]).send();
    const status = value[0];
    if (status?.err) throw new Error(`La transacción ${signature} falló: ${JSON.stringify(status.err, jsonBigInt)}`);
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") return signature;

    const blockHeight = await rpc.getBlockHeight({ commitment: "confirmed" }).send();
    if (blockHeight > latestBlockhash.lastValidBlockHeight) {
      throw new Error(`La transacción ${signature} caducó sin confirmarse`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

export const jsonBigInt = (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value);
