import { useTranslation } from 'react-i18next'

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'xh'

  const setLang = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div
      className={['inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1 text-sm', className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang('xh')}
        className={[
          'min-h-touch min-w-[44px] rounded-md px-2 font-semibold transition-colors',
          current === 'xh' ? 'bg-accent text-primary' : 'text-muted hover:text-[var(--color-text)]',
        ].join(' ')}
        aria-pressed={current === 'xh'}
      >
        XH
      </button>
      <span className="text-border" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={[
          'min-h-touch min-w-[44px] rounded-md px-2 font-semibold transition-colors',
          current === 'en' ? 'bg-accent text-primary' : 'text-muted hover:text-[var(--color-text)]',
        ].join(' ')}
        aria-pressed={current === 'en'}
      >
        EN
      </button>
    </div>
  )
}

export default LanguageSwitcher
