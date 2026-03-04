import './globals.css';
import './layout.css';
import Link from 'next/link';

export const metadata = {
  title: 'Indian Basketball | Stats & Analytics',
  description: 'The definitive statistical reference for Indian Basketball Senior Nationals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          {/* Top Bar Navigation */}
          <header className="topbar">
            <div className="topbar-content">
              <Link href="/" className="brand">
                <span className="brand-dot"></span>
                tappa.bb
              </Link>

              <nav className="nav-links">
                <Link href="/" className="nav-item">Home</Link>
                <Link href="/tournaments" className="nav-item">Tournaments</Link>
                <Link href="/teams" className="nav-item">Teams</Link>
                <Link href="/players" className="nav-item">Players</Link>
                <Link href="/compare" className="nav-item">Compare</Link>
              </nav>

              <div className="search-bar">
                <input type="text" placeholder="Search..." />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="content">
            <div className="page-content">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
