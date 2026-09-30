import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, type Locale } from "@/i18n/config";

// Elige el idioma a partir de la cabecera Accept-Language del navegador
// (p. ej. "es-ES,es;q=0.9,en;q=0.8"), respetando el orden de preferencia.
function preferredLocale(header: string | null): Locale {
  if (!header) return defaultLocale;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((entry) => !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);
  for (const { base } of ranked) {
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}

// Toda ruta sin idioma (/, /verify…) se redirige a su versión con idioma (/en, /es/verify…).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";
  if (hasLocale(firstSegment)) return;

  const locale = preferredLocale(request.headers.get("accept-language"));
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Deja fuera las rutas internas, la API y los ficheros con extensión (iconos, imágenes…).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
