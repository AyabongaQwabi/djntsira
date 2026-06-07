import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { customerSchema } from '../../lib/schemas'
import { formatCurrency } from '../../lib/format'
import { getItemPricing, validatePurchasePrice } from '../../lib/pricing'
import { startMusicCheckout, redirectToPayment } from '../../lib/yoco'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

const BuyModal = ({ open, onClose, item, itemType = 'track' }) => {
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: '',
      cell_number: '',
      email: '',
    },
  })

  const itemName = itemType === 'bundle' ? item?.name : item?.title
  const pricing = item ? getItemPricing(item) : null

  const handleClose = () => {
    reset()
    setSubmitError(null)
    onClose()
  }

  const onSubmit = async (formData) => {
    if (!item) return

    setSubmitError(null)
    setSubmitting(true)

    try {
      const { paymentUrl } = await startMusicCheckout({
        item,
        trackId: itemType === 'track' ? item.id : undefined,
        bundleId: itemType === 'bundle' ? item.id : undefined,
        customer: formData,
      })

      if (!paymentUrl) {
        throw new Error('Payment URL could not be generated')
      }

      redirectToPayment(paymentUrl)
    } catch (err) {
      setSubmitError(
        err?.message ||
          t('music.checkout_error', {
            defaultValue: 'Akuphumelelanga ukuqala intlawulo. Zama kwakhona.',
          })
      )
      setSubmitting(false)
    }
  }

  if (!item) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('music.buy_title', { defaultValue: 'Thenga' })}
      mobileAsSheet
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <p className="text-sm text-muted">
            {t('music.item_label', { defaultValue: 'Into' })}
          </p>
          <p className="font-medium text-[var(--color-text)]">{itemName}</p>
          <p className="mt-2 font-display text-2xl text-accent">
            {formatCurrency(pricing?.current ?? validatePurchasePrice(item))}
          </p>
          {pricing?.hasDiscount ? (
            <p className="text-sm text-muted line-through">
              {formatCurrency(pricing.base)}
            </p>
          ) : null}
        </div>

        <Input
          label={t('booking.full_name')}
          error={errors.full_name?.message}
          {...register('full_name')}
          autoComplete="name"
        />
        <Input
          label={t('booking.cell')}
          type="tel"
          inputMode="tel"
          error={errors.cell_number?.message}
          {...register('cell_number')}
          autoComplete="tel"
        />
        <Input
          label={t('booking.email')}
          type="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
          autoComplete="email"
        />

        {submitError ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" fullWidth loading={submitting} size="lg">
          {t('music.proceed_pay', { defaultValue: 'Qhubeka Ukuhlawula' })}
        </Button>
      </form>
    </Modal>
  )
}

export default BuyModal
