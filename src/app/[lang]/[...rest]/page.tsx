import { notFound } from "next/navigation";

// Cualquier dirección desconocida dentro de /en o /es muestra nuestra página 404 (not-found.tsx),
// con la barra superior y en su idioma, en vez de la genérica de Next.js.
export default function CatchAll() {
  notFound();
}
