import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Music2 } from 'lucide-react'
import LanguageSwitcher from '../shared/LanguageSwitcher'

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
)

const navLinkClass = ({ isActive }) =>
  [
    'min-h-touch inline-flex items-center px-3 font-medium transition-colors',
    isActive ? 'text-accent' : 'text-muted hover:text-[var(--color-text)]',
  ].join(' ')

const PublicLayout = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-40 border-b border-border bg-[var(--color-bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex min-h-touch items-center gap-2">
            <img
              src="/images/logo.png"
              alt="DJ Ntsira"
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="font-display text-2xl tracking-wide text-accent">DJ NTSIRA</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            <NavLink to="/music" className={navLinkClass}>
              {t('nav.music')}
            </NavLink>
            <NavLink to="/book" className={navLinkClass}>
              {t('nav.book')}
            </NavLink>
          </nav>

          <LanguageSwitcher />
        </div>

        <nav
          className="flex border-t border-border sm:hidden"
          aria-label="Mobile main"
        >
          <NavLink
            to="/music"
            className={({ isActive }) =>
              [
                'flex min-h-touch flex-1 items-center justify-center gap-2 text-sm font-medium',
                isActive ? 'text-accent' : 'text-muted',
              ].join(' ')
            }
          >
            <Music2 className="h-5 w-5" aria-hidden="true" />
            {t('nav.music')}
          </NavLink>
          <NavLink
            to="/book"
            className={({ isActive }) =>
              [
                'flex min-h-touch flex-1 items-center justify-center gap-2 border-l border-border text-sm font-medium',
                isActive ? 'text-accent' : 'text-muted',
              ].join(' ')
            }
          >
            {t('nav.book')}
          </NavLink>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl text-accent">DJ NTSIRA</p>
            <p className="mt-1 text-sm text-muted">{t('home.footer_tagline')}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61556947102512"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-border text-muted hover:border-accent hover:text-accent"
              aria-label="Facebook"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/djntsira/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-border text-muted hover:border-accent hover:text-accent"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.tiktok.com/@djntsira_sa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-border text-muted hover:border-accent hover:text-accent"
              aria-label="TikTok"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
