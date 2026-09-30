// Logotipo provisional (dos círculos enlazados, DESIGN.md §10).
// Es el único sitio donde vive: al cambiarlo aquí cambia en toda la web.
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="var(--primario)"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="19" cy="14" r="5.5" />
    </svg>
  );
}
