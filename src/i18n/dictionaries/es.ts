import type { Dictionary } from "./en";

// Textos en español de España, con tuteo (DESIGN.md §7).
export const es: Dictionary = {
  meta: {
    title: "People's Protocol",
    description:
      "Un historial de lo que has pagado a tiempo, portátil y verificable por cualquiera, sin pedir permiso a quien lo guardó primero.",
  },
  a11y: {
    skipToContent: "Saltar al contenido",
    mainNav: "Navegación principal",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    changeLanguage: "Cambiar idioma",
    home: "People's Protocol, inicio",
  },
  nav: {
    home: "Inicio",
    generate: "Generar prueba",
    verify: "Verificar",
    institutions: "Para instituciones",
    help: "Ayuda",
  },
  network: {
    devnet: "Devnet",
    devnetTitle: "Piloto en la red de pruebas de Solana (devnet)",
  },
  language: {
    otherName: "English",
  },
  home: {
    eyebrow: "Para inquilinos, empleados y autónomos",
    title: "Lo que has pagado a tiempo, por fin demostrable.",
    lead: "Lleva tu historial contigo a otra ciudad, a otro banco, a otro casero. Sin papeles que se puedan editar ni cartas imposibles de comprobar.",
    ctaGenerate: "Generar mi prueba",
    ctaVerify: "Comprobar una prueba",
    steps: [
      { title: "Pagas como siempre", body: "El hecho ocurre en tu banco o en tu sistema de facturación." },
      { title: "Generas la prueba", body: "Un login dirigido de menos de un minuto, o el QR de tu factura." },
      { title: "Se registra en Solana", body: "Queda ligada a tu wallet, no a tu email ni a tu DNI." },
      { title: "Quien quieras la comprueba", body: "Con un enlace, sin pedir permiso a nadie." },
    ],
  },
  placeholder: {
    underConstruction: "Esta pantalla está en construcción.",
    backHome: "Volver al inicio",
  },
  notFound: {
    title: "Página no encontrada",
    body: "La dirección que has abierto no existe.",
  },
};
