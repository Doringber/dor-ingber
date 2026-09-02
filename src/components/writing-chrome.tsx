import Link from "next/link";

export function WritingChrome() {
  return (
    <header className="writing-chrome">
      <Link href="/" className="writing-wordmark tap" aria-label="Dor Ingber home">
        Dor Ingber
      </Link>
      <nav aria-label="Primary">
        <ul className="nav-list">
          <li>
            <Link href="/#work" className="nav-link tap">
              Work
            </Link>
          </li>
          <li>
            <Link href="/#writing" className="nav-link tap">
              Writing
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
