import { useState } from 'react'
import { DataTable, ExportButton, WhatsAppBtn } from '../../components/ui'
import MarkAsPaidButton from '../../components/admin/MarkAsPaidButton'
import ResendEmailButton from '../../components/admin/ResendEmailButton'
import {
  useBuyersWithStats,
  useBookersWithStats,
  useEmailLogs,
} from '../../hooks/useCustomers'
import { formatCurrency, formatDate } from '../../lib/format'
import { formatPhoneDisplay } from '../../lib/phone'

const BUYER_EXPORT = {
  full_name: 'Name',
  cell_number: 'Cell',
  email: 'Email',
  tracksPurchased: 'Tracks Purchased',
  totalSpent: 'Total Spent',
  lastPurchaseDate: 'Last Purchase Date',
}

const BOOKER_EXPORT = {
  full_name: 'Name',
  cell_number: 'Cell',
  email: 'Email',
  eventsBooked: 'Events Booked',
  totalSpent: 'Total Spent',
  lastBookingDate: 'Last Booking Date',
}

const Customers = () => {
  const [tab, setTab] = useState('buyers')
  const [search, setSearch] = useState('')

  const { data: buyers = [], isLoading: buyersLoading, refetch: refetchBuyers } =
    useBuyersWithStats(search)
  const { data: bookers = [], isLoading: bookersLoading } =
    useBookersWithStats(search)
  const { data: failedEmails = [] } = useEmailLogs({ status: 'failed', limit: 20 })

  const buyerExportRows = buyers.map((c) => ({
    full_name: c.full_name,
    cell_number: c.cell_number,
    email: c.email,
    tracksPurchased: c.tracksPurchased,
    totalSpent: c.totalSpent,
    lastPurchaseDate: c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : '',
  }))

  const bookerExportRows = bookers.map((c) => ({
    full_name: c.full_name,
    cell_number: c.cell_number,
    email: c.email,
    eventsBooked: c.eventsBooked,
    totalSpent: c.totalSpent,
    lastBookingDate: c.lastBookingDate ? formatDate(c.lastBookingDate) : '',
  }))

  const buyerColumns = [
    { key: 'full_name', label: 'Name' },
    {
      key: 'cell_number',
      label: 'Cell',
      render: (row) => formatPhoneDisplay(row.cell_number),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'tracksPurchased',
      label: 'Tracks Purchased',
      render: (row) => row.tracksPurchased,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (row) => formatCurrency(row.totalSpent),
    },
    {
      key: 'lastPurchaseDate',
      label: 'Last Purchase',
      render: (row) =>
        row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <WhatsAppBtn phone={row.cell_number} iconOnly label="WhatsApp" />
          {row.pendingPurchases?.map((p) => (
            <MarkAsPaidButton
              key={p.id}
              purchaseId={p.id}
              status={p.status}
              onSuccess={() => refetchBuyers()}
            />
          ))}
        </div>
      ),
    },
  ]

  const bookerColumns = [
    { key: 'full_name', label: 'Name' },
    {
      key: 'cell_number',
      label: 'Cell',
      render: (row) => formatPhoneDisplay(row.cell_number),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span className="capitalize text-muted">{row.type}</span>
      ),
    },
    {
      key: 'eventsBooked',
      label: 'Events Booked',
      render: (row) => row.eventsBooked,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (row) => formatCurrency(row.totalSpent),
    },
    {
      key: 'lastBookingDate',
      label: 'Last Booking',
      render: (row) =>
        row.lastBookingDate ? formatDate(row.lastBookingDate) : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => <WhatsAppBtn phone={row.cell_number} iconOnly label="WhatsApp" />,
    },
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-accent">Customers</h1>
          <p className="mt-1 text-sm text-muted">
            Music buyers and booking clients with WhatsApp and export.
          </p>
        </div>
        <ExportButton
          data={tab === 'buyers' ? buyerExportRows : bookerExportRows}
          filename={tab === 'buyers' ? 'music-buyers' : 'booking-clients'}
          columnMap={tab === 'buyers' ? BUYER_EXPORT : BOOKER_EXPORT}
          label="Export .xlsx"
          disabled={tab === 'buyers' ? buyersLoading : bookersLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {[
          { id: 'buyers', label: 'Music Buyers' },
          { id: 'bookers', label: 'Booking Clients' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-touch rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        <input
          type="search"
          placeholder="Search name, email, or cell…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-touch w-full max-w-md rounded-lg border border-border bg-surface px-4 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {tab === 'buyers' ? (
        <DataTable
          columns={buyerColumns}
          data={buyers}
          loading={buyersLoading}
          searchable={false}
          emptyMessage="No music buyers found."
        />
      ) : (
        <DataTable
          columns={bookerColumns}
          data={bookers}
          loading={bookersLoading}
          searchable={false}
          emptyMessage="No booking clients found."
        />
      )}

      {failedEmails.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h2 className="font-medium text-amber-400">Failed emails</h2>
          <p className="mt-1 text-sm text-muted">
            Resend via the original edge function using email_logs payload.
          </p>
          <ul className="mt-3 space-y-2">
            {failedEmails.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{log.recipient}</p>
                  <p className="text-xs text-muted">
                    {log.trigger_name} · {formatDate(log.created_at)}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-red-400">{log.error_message}</p>
                  )}
                </div>
                <ResendEmailButton log={log} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default Customers
