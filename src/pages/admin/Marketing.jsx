import { useState } from 'react'
import { Send } from 'lucide-react'
import { DataTable } from '../../components/ui'
import {
  useMarketingRecipientCount,
  useSendMarketingEmail,
  useSentCampaigns,
} from '../../hooks/useCustomers'
import { formatDate } from '../../lib/format'

const Marketing = () => {
  const [segment, setSegment] = useState('all_bookers')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const countParams = {
    segment,
    dateFrom: segment === 'date_range' ? dateFrom : undefined,
    dateTo: segment === 'date_range' ? dateTo : undefined,
  }

  const { data: recipientCount = 0, isLoading: countLoading } =
    useMarketingRecipientCount(countParams)

  const { data: campaigns = [], isLoading: campaignsLoading } = useSentCampaigns()
  const sendMutation = useSendMarketingEmail()

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return
    if (segment === 'date_range' && (!dateFrom || !dateTo)) return

    sendMutation.mutate({
      subject: subject.trim(),
      body: body.trim(),
      segment,
      dateFrom: segment === 'date_range' ? dateFrom : undefined,
      dateTo: segment === 'date_range' ? dateTo : undefined,
    })
  }

  const campaignColumns = [
    {
      key: 'sent_at',
      label: 'Date',
      render: (row) => formatDate(row.sent_at),
    },
    { key: 'subject', label: 'Subject' },
    {
      key: 'recipient_count',
      label: 'Recipients',
      render: (row) => row.recipient_count,
    },
  ]

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
      <div>
        <h1 className="font-display text-3xl text-accent">Marketing</h1>
        <p className="mt-1 text-sm text-muted">
          Send bulk emails to booking clients. Opted-out customers are excluded automatically.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-medium text-white">Compose campaign</h2>

        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Target segment</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="segment"
              checked={segment === 'all_bookers'}
              onChange={() => setSegment('all_bookers')}
            />
            All booking clients
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="segment"
              checked={segment === 'date_range'}
              onChange={() => setSegment('date_range')}
            />
            Bookings in date range
          </label>
        </fieldset>

        {segment === 'date_range' && (
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="text-muted">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 block min-h-touch rounded-lg border border-border bg-surface-2 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 block min-h-touch rounded-lg border border-border bg-surface-2 px-3 py-2"
              />
            </label>
          </div>
        )}

        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          {countLoading
            ? 'Calculating recipients…'
            : `This will send to ${recipientCount} customer${recipientCount === 1 ? '' : 's'}.`}
          <span className="mt-1 block text-xs text-muted">
            Customers who opted out of marketing are excluded.
          </span>
        </p>

        <label className="block text-sm">
          <span className="text-muted">Subject line</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 min-h-touch w-full rounded-lg border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
            placeholder="e.g. New tracks available"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted">Email body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
            placeholder="Write your message. An unsubscribe link is added automatically."
          />
        </label>

        <button
          type="button"
          onClick={handleSend}
          disabled={
            sendMutation.isPending ||
            !subject.trim() ||
            !body.trim() ||
            recipientCount === 0
          }
          className="inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-primary transition hover:bg-accent-light disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sendMutation.isPending ? 'Sending…' : 'Send campaign'}
        </button>

        {sendMutation.isSuccess && (
          <p className="text-sm text-emerald-400">Campaign queued successfully.</p>
        )}
        {sendMutation.isError && (
          <p className="text-sm text-red-400">{sendMutation.error.message}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-white">Sent campaigns</h2>
        <DataTable
          columns={campaignColumns}
          data={campaigns}
          loading={campaignsLoading}
          searchable={false}
          emptyMessage="No campaigns sent yet."
        />
      </section>
    </main>
  )
}

export default Marketing
