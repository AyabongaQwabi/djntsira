import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XCircle } from 'lucide-react'
import Button from '../../components/ui/Button'

const PaymentCancel = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
      <XCircle className="mb-4 h-16 w-16 text-[var(--color-warning)]" aria-hidden="true" />

      <h1 className="font-display text-3xl text-accent">
        {t('payment.cancel_title', { defaultValue: 'Intlawulo irhoxisiwe' })}
      </h1>

      <p className="mt-3 text-muted">
        {t('payment.cancel_body', {
          defaultValue:
            'Awuyiqedanga intlawulo. Uma uhlawule ngempazamo, jonga i-imeyile yakho okanye uxhumane nathi.',
        })}
      </p>

      {ref ? (
        <p className="mt-4 text-xs text-muted">
          {t('payment.ref_label', { defaultValue: 'Reference' })}: {ref}
        </p>
      ) : null}

      <Link to="/music" className="mt-8 inline-block w-full">
        <Button size="lg" fullWidth>
          {t('payment.try_again', { defaultValue: 'Buyela emva uze uzame kwakhona' })}
        </Button>
      </Link>
    </main>
  )
}

export default PaymentCancel
