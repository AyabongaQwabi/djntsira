import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { settingsSchema } from '../../lib/schemas'
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'

const Settings = () => {
  const { data: settings, isLoading, error } = useSettings()
  const updateSettings = useUpdateSettings()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      day_rate: 1500,
      night_rate: 2000,
      night_start_hour: 20,
      deposit_percent: 50,
      transport_threshold_km: 20,
      transport_base_fee: 200,
      travel_buffer_hours: 2,
      download_expiry_days: 7,
      hospitality_text_xh: '',
      hospitality_text_en: '',
    },
  })

  useEffect(() => {
    if (settings) {
      reset({
        day_rate: Number(settings.day_rate),
        night_rate: Number(settings.night_rate),
        night_start_hour: settings.night_start_hour,
        deposit_percent: settings.deposit_percent,
        transport_threshold_km: settings.transport_threshold_km,
        transport_base_fee: Number(settings.transport_base_fee),
        travel_buffer_hours: settings.travel_buffer_hours,
        download_expiry_days: settings.download_expiry_days,
        hospitality_text_xh: settings.hospitality_text_xh || '',
        hospitality_text_en: settings.hospitality_text_en || '',
      })
    }
  }, [settings, reset])

  const onSubmit = (values) => {
    updateSettings.mutate(values, {
      onSuccess: (data) => reset({
        day_rate: Number(data.day_rate),
        night_rate: Number(data.night_rate),
        night_start_hour: data.night_start_hour,
        deposit_percent: data.deposit_percent,
        transport_threshold_km: data.transport_threshold_km,
        transport_base_fee: Number(data.transport_base_fee),
        travel_buffer_hours: data.travel_buffer_hours,
        download_expiry_days: data.download_expiry_days,
        hospitality_text_xh: data.hospitality_text_xh || '',
        hospitality_text_en: data.hospitality_text_en || '',
      }),
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        <span className="sr-only">Loading settings</span>
      </div>
    )
  }

  if (error) {
    return (
      <main className="p-4 md:p-6">
        <p className="text-error">Failed to load settings. Please refresh and try again.</p>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl tracking-wide text-accent">Settings</h1>
        <p className="mt-1 text-sm text-muted">Configure rates, deposits, transport, and hospitality text.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-8">
        <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Booking rates</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Day rate (R/hr)" error={errors.day_rate?.message}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={inputClass}
                {...register('day_rate', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Night rate (R/hr)" error={errors.night_rate?.message}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={inputClass}
                {...register('night_rate', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Night booking starts at (hour, 0–23)"
              error={errors.night_start_hour?.message}
            >
              <input
                type="number"
                min="0"
                max="23"
                className={inputClass}
                {...register('night_start_hour', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Deposit percentage (10–100%)"
              error={errors.deposit_percent?.message}
            >
              <input
                type="number"
                min="10"
                max="100"
                className={inputClass}
                {...register('deposit_percent', { valueAsNumber: true })}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Transport & scheduling</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Transport threshold (km)"
              error={errors.transport_threshold_km?.message}
            >
              <input
                type="number"
                min="1"
                className={inputClass}
                {...register('transport_threshold_km', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Transport base fee (R)" error={errors.transport_base_fee?.message}>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                {...register('transport_base_fee', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Travel buffer between towns (hours)"
              error={errors.travel_buffer_hours?.message}
            >
              <input
                type="number"
                min="1"
                max="6"
                className={inputClass}
                {...register('travel_buffer_hours', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Download link expiry (days)"
              error={errors.download_expiry_days?.message}
            >
              <input
                type="number"
                min="1"
                max="30"
                className={inputClass}
                {...register('download_expiry_days', { valueAsNumber: true })}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Hospitality requirements</h2>
          <p className="mb-4 text-sm text-muted">
            Shown on the public booking form. Both languages are required.
          </p>
          <div className="space-y-4">
            <Field label="isiXhosa text" error={errors.hospitality_text_xh?.message}>
              <textarea
                rows={4}
                className={inputClass}
                {...register('hospitality_text_xh')}
              />
            </Field>
            <Field label="English text" error={errors.hospitality_text_en?.message}>
              <textarea
                rows={4}
                className={inputClass}
                {...register('hospitality_text_en')}
              />
            </Field>
          </div>
        </section>

        {updateSettings.isError && (
          <p className="text-sm text-error" role="alert">
            {updateSettings.error?.message || 'Failed to save settings.'}
          </p>
        )}
        {updateSettings.isSuccess && (
          <p className="text-sm text-success" role="status">
            Settings saved successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={updateSettings.isPending || !isDirty}
          className="flex min-h-touch w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-medium text-primary transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Save className="h-5 w-5" aria-hidden />
          )}
          Save settings
        </button>
      </form>
    </main>
  )
}

const inputClass =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-touch'

const Field = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-white">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-error">{error}</span>}
  </label>
)

export default Settings
