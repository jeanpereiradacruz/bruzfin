/** Logo BruzFin (barras crescentes), cores do tema. */
export function Logo() {
  return (
    <svg role="img" aria-label="BruzFin" width="56" height="56" viewBox="0 0 56 56">
      <rect className="bf-logo-bg" width="56" height="56" rx="16" />
      <rect className="bf-logo-bar" x="14" y="30" width="8" height="14" rx="4" />
      <rect className="bf-logo-bar" x="24" y="22" width="8" height="22" rx="4" />
      <rect className="bf-logo-bar" x="34" y="12" width="8" height="32" rx="4" />
    </svg>
  );
}
