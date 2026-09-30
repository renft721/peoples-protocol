import { listHolderAttestations } from "@/protocol/history";

// Historial de un titular: todas las pruebas del piloto ligadas a una wallet.

export const maxDuration = 20;

export async function GET(_request: Request, ctx: RouteContext<"/api/holders/[wallet]">) {
  const { wallet } = await ctx.params;
  try {
    const result = await listHolderAttestations(wallet);
    return Response.json(result, { status: result.status === "ok" ? 200 : 400 });
  } catch (error) {
    console.error("Error al leer el historial", error);
    return Response.json({ status: "network_error" }, { status: 502 });
  }
}
