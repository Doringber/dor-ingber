import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-wrap header-inner">
        <Link href="/" className="logo tap" aria-label="Dor Ingber home">
          <span className="logo-full">DOR · INGBER</span>
          <span className="logo-short">DOR</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="nav-list">
            <li>
              <Link href="/#work" className="nav-link tap">
                Work
              </Link>
            </li>
            <li aria-hidden className="nav-dot">
              ·
            </li>
            <li>
              <Link href="/#writing" className="nav-link tap">
                Writing
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
