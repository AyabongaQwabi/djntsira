import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Clock, Mail } from 'lucide-react'
import { usePaymentWithConfirmation } from '../../lib/yoco'
import { formatCurrency } from '../../lib/format'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const PaymentSuccess = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')

  const { kind, id, data, isLoading, error, isFetching } = usePaymentWithConfirmation(ref)

  const isBooking = kind === 'booking'
  const isPaid = isBooking
    ? data?.status === 'deposit_paid'
    : data?.status === 'paid'
  const isPending = isBooking
    ? data?.status === 'deposit_requested'
    : data?.status === 'pending'

  const amount = isBooking ? data?.deposit_amount : data?.amount_paid

  if (!ref || !kind || !id) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
        <p className="text-[var(--color-error)]" role="alert">
          {t('payment.missing_ref', {
            defaultValue: 'Akukho reference yentlawulo ifunyenweyo.',
          })}
        </p>
        <Link to="/music" className="mt-6 inline-block w-full max-w-xs">
          <Button fullWidth>{t('music.back_store', { defaultValue: 'Buyela evenkileni' })}</Button>
        </Link>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Spinner size="lg" label={t('common.loading')} />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
        <p className="text-[var(--color-error)]" role="alert">
          {t('payment.status_error', {
            defaultValue: 'Asikwazi ukuqinisekisa imeko yentlawulo. Jonga i-imeyile yakho.',
          })}
        </p>
        <Link to={isBooking ? '/book' : '/music'} className="mt-6 inline-block w-full max-w-xs">
          <Button fullWidth>
            {isBooking
              ? t('book.back', { defaultValue: 'Buyela ekubhukeni' })
              : t('music.back_store', { defaultValue: 'Buyela evenkileni' })}
          </Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
      {isPaid ? (
        <CheckCircle
          className="mb-4 h-16 w-16 text-[var(--color-success)]"
          aria-hidden="true"
        />
      ) : (
        <Clock className="mb-4 h-16 w-16 text-[var(--color-warning)]" aria-hidden="true" />
      )}

      <h1 className="font-display text-3xl text-accent">
        {isPaid
          ? isBooking
            ? t('payment.deposit_success_title', { defaultValue: 'Idiphozithi ifunyenwe!' })
            : t('payment.success_title', { defaultValue: 'Intlawulo iphumelele!' })
          : t('payment.pending_title', { defaultValue: 'Siyayiqinisekisa intlawulo yakho' })}
      </h1>

      <p className="mt-3 text-muted">
        {isPaid
          ? isBooking
            ? t('payment.deposit_success_body', {
                defaultValue:
                  'Enkosi! Sifumene idiphozithi yakho. Siza kuqhagamshelana nawe ngokukhawuleza.',
              })
            : t('payment.success_body', {
                defaultValue:
                  'Enkosi! I-imeyile ene-link yokukhuphela izakuza kungekudala.',
              })
          : t('payment.pending_body', {
              defaultValue:
                'Intlawulo isaqinisekiswa. Oku kungathatha imizuzwana embalwa — ungaphindi uhlawule.',
            })}
      </p>

      {amount ? (
        <p className="mt-4 font-display text-2xl text-[var(--color-text)]">
          {formatCurrency(amount)}
        </p>
      ) : null}

      {isPending && isFetching ? (
        <p className="mt-4 text-sm text-muted">
          {t('payment.checking', { defaultValue: 'Siyayijonga imeko...' })}
        </p>
      ) : null}

      {!isBooking && isPaid && data?.download_token ? (
        <Link
          to={`/download/${data.download_token}`}
          className="mt-8 inline-block w-full"
        >
          <Button size="lg" fullWidth>
            {t('payment.download_now', { defaultValue: 'Khuphela ngoku' })}
          </Button>
        </Link>
      ) : null}

      <div className="mt-6 flex items-center gap-2 text-sm text-muted">
        <Mail className="h-4 w-4" aria-hidden="true" />
        <span>
          {isBooking
            ? t('payment.deposit_email_hint', {
                defaultValue: 'Uya kufumana i-imeyile yoqinisekiso.',
              })
            : t('payment.email_hint', {
                defaultValue: 'Uya kufumana i-imeyile ene-link yokukhuphela.',
              })}
        </span>
      </div>

      <Link to={isBooking ? '/book' : '/music'} className="mt-4 inline-block">
        <Button variant="ghost">
          {isBooking
            ? t('book.back', { defaultValue: 'Buyela ekubhukeni' })
            : t('music.back_store', { defaultValue: 'Buyela evenkileni' })}
        </Button>
      </Link>
    </main>
  )
}

export default PaymentSuccess
