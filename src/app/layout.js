import './globals.css';
import './layout.css';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';

export const metadata = {
  title: 'Indian Basketball | Stats & Analytics',
  description: 'Premium basketball analytics for the Indian Senior Nationals.',
  manifest: '/manifest.json',
  themeColor: '#d16b07',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          {/* Top Bar Navigation */}
          <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.75rem 2rem',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(9, 9, 11, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
            <div className="topbar-content">
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                 <img src="/tappa-logo.svg" alt="Tappa Logo" style={{ width: '36px', height: '36px' }} />
                 <span style={{ 
                   color: 'white', 
                   fontSize: '1.4rem', 
                   fontWeight: '800', 
                   fontFamily: "'Space Grotesk', sans-serif",
                   letterSpacing: '-0.02em',
                   display: 'flex',
                   alignItems: 'center'
                 }}>
                   tappa<span style={{ color: 'var(--tappa-orange)' }}>.bb</span>
                 </span>
              </Link>

              <nav className="nav-links">
                <Link href="/" className="nav-item">Home</Link>
                <Link href="/tournaments" className="nav-item">Tournaments</Link>
                <Link href="/players" className="nav-item">Players</Link>
                <Link href="/teams" className="nav-item">Teams</Link>
                <Link href="/stats" className="nav-item">Stats Hub</Link>
                <Link href="/compare" className="nav-item">Compare</Link>
              </nav>

              <SearchBar />
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
