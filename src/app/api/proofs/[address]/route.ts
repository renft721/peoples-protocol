import { readAttestation } from "@/protocol/read";

// Leer una atestación por su dirección (página «Comprobar una prueba»).
// Pasa por el servidor para no exponer en el navegador la clave del RPC (Helius).

export const maxDuration = 20;

const HTTP_STATUS = { found: 200, invalid_address: 400, not_found: 404, closed: 410, foreign: 422 } as const;

export async function GET(_request: Request, ctx: RouteContext<"/api/proofs/[address]">) {
  const { address } = await ctx.params;
  try {
    const result = await readAttestation(address);
    return Response.json(result, { status: HTTP_STATUS[result.status] });
  } catch (error) {
    console.error("Error al leer la atestación", error);
    return Response.json({ status: "network_error" }, { status: 502 });
  }
}
