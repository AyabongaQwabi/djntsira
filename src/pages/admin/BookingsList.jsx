import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { DataTable, ExportButton, WhatsAppBtn } from '../../components/ui'
import BookingStatusBadge from '../../components/admin/BookingStatusBadge'
import BookingDetailModal from '../../components/admin/BookingDetailModal'
import {
  fetchBookingsWithCustomers,
  updateBookingStatus,
  updateBookingTransport,
  sendDepositRequest,
  notifyTransportChange,
} from '../../components/admin/bookingActions'
import { useSettings } from '../../hooks/useSettings'
import { BOOKING_STATUSES } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/format'

const EXPORT_COLUMNS = {
  event_date: 'Date',
  customer_name: 'Customer Name',
  event_type: 'Event Type',
  venue_city: 'Venue City',
  hours_booked: 'Hours',
  total_amount: 'Total Amount',
  status: 'Status',
}

const BookingsList = () => {
  const queryClient = useQueryClient()
  const { data: settings } = useSettings()

  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [statusFilter, dateFrom, dateTo]
  )

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', 'admin-list', filters],
    queryFn: () => fetchBookingsWithCustomers(filters),
  })

  const statusMutation = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })

  const transportMutation = useMutation({
    mutationFn: async (payload) => {
      const updated = await updateBookingTransport({
        id: selectedBooking.id,
        ...payload,
      })
      await notifyTransportChange(selectedBooking.id)
      return updated
    },
    onSuccess: (updated) => {
      setSelectedBooking((prev) => ({ ...prev, ...updated }))
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })

  const depositMutation = useMutation({
    mutationFn: async (booking) => {
      const customer = booking.customers
      return sendDepositRequest(booking, customer)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setDetailOpen(false)
    },
  })

  const exportRows = bookings.map((b) => ({
    event_date: formatDate(b.event_date),
    customer_name: b.customers?.full_name || '',
    event_type: b.event_type,
    venue_city: b.venue_city,
    hours_booked: b.hours_booked,
    total_amount: Number(b.total_amount),
    status: b.status,
  }))

  const openDetails = (booking) => {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  const columns = [
    {
      key: 'event_date',
      label: 'Date',
      render: (row) => formatDate(row.event_date),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => row.customers?.full_name || '—',
    },
    { key: 'event_type', label: 'Event Type' },
    { key: 'venue_city', label: 'Venue City' },
    {
      key: 'hours_booked',
      label: 'Hours',
      render: (row) => `${row.hours_booked}h`,
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (row) => formatCurrency(row.total_amount),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <BookingStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openDetails(row)}
            className="inline-flex min-h-touch items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:border-accent"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </button>
          {row.customers?.cell_number && (
            <WhatsAppBtn phone={row.customers.cell_number} iconOnly label="WhatsApp" />
          )}
        </div>
      ),
    },
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-accent">Bookings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage booking requests, deposits, and status transitions.
          </p>
        </div>
        <ExportButton
          data={exportRows}
          filename="bookings-export"
          columnMap={EXPORT_COLUMNS}
          label="Export .xlsx"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-touch rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="min-h-touch rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="min-h-touch rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        loading={isLoading}
        searchable={false}
        emptyMessage="No bookings match your filters."
      />

      <BookingDetailModal
        key={selectedBooking?.id}
        booking={selectedBooking}
        customer={selectedBooking?.customers}
        settings={settings}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        statusLoading={statusMutation.isPending}
        depositLoading={depositMutation.isPending}
        transportLoading={transportMutation.isPending}
        onUpdateStatus={(toStatus) => {
          statusMutation.mutate(
            {
              id: selectedBooking.id,
              fromStatus: selectedBooking.status,
              toStatus,
            },
            {
              onSuccess: (updated) => {
                setSelectedBooking((prev) => ({ ...prev, ...updated }))
              },
            }
          )
        }}
        onSendDepositRequest={(booking) => depositMutation.mutate(booking)}
        onSaveTransport={(payload) => transportMutation.mutate(payload)}
      />

      {(statusMutation.isError ||
        depositMutation.isError ||
        transportMutation.isError) && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {statusMutation.error?.message ||
            depositMutation.error?.message ||
            transportMutation.error?.message}
        </p>
      )}
    </main>
  )
}

export default BookingsList
