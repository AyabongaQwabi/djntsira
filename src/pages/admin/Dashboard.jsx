import { useQuery } from '@tanstack/react-query'
import { Loader2, MessageCircle, TrendingUp, Calendar, Clock, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, formatTime } from '../../lib/format'
import { buildWhatsAppUrl } from '../../lib/phone'

const BOOKING_STATUS_STYLES = {
  pending: 'bg-warning/20 text-warning',
  deposit_requested: 'bg-amber-500/20 text-amber-400',
  deposit_paid: 'bg-blue-500/20 text-blue-400',
  confirmed: 'bg-success/20 text-success',
  completed: 'bg-muted/20 text-muted',
  cancelled: 'bg-error/20 text-error',
}

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        purchasesRes,
        bookingsRes,
        customersRes,
        recentBookingsRes,
        recentSalesRes,
      ] = await Promise.all([
        supabase.from('purchases').select('amount_paid, status'),
        supabase.from('bookings').select('id, status'),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase
          .from('bookings')
          .select(
            `id, event_type, venue_city, event_date, start_time, total_amount, status,
             customer:customers(full_name, cell_number)`
          )
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('purchases')
          .select(
            `id, amount_paid, status, paid_at, created_at,
             customer:customers(full_name, cell_number),
             track:tracks(title),
             bundle:bundles(name)`
          )
          .eq('status', 'paid')
          .order('paid_at', { ascending: false })
          .limit(5),
      ])

      if (purchasesRes.error) throw purchasesRes.error
      if (bookingsRes.error) throw bookingsRes.error
      if (customersRes.error) throw customersRes.error
      if (recentBookingsRes.error) throw recentBookingsRes.error
      if (recentSalesRes.error) throw recentSalesRes.error

      const totalRevenue = (purchasesRes.data || [])
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount_paid), 0)

      const bookings = bookingsRes.data || []
      const pendingBookings = bookings.filter((b) => b.status === 'pending').length

      return {
        totalRevenue,
        totalBookings: bookings.length,
        pendingBookings,
        totalCustomers: customersRes.count ?? 0,
        recentBookings: recentBookingsRes.data || [],
        recentSales: recentSalesRes.data || [],
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        <span className="sr-only">Loading dashboard</span>
      </div>
    )
  }

  if (error) {
    return (
      <main className="p-4 md:p-6">
        <p className="text-error">Failed to load dashboard. Please refresh and try again.</p>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl tracking-wide text-accent">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview of revenue, bookings, and recent activity.</p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total revenue"
          value={formatCurrency(data.totalRevenue)}
        />
        <StatCard
          icon={Calendar}
          label="Total bookings"
          value={String(data.totalBookings)}
        />
        <StatCard
          icon={Clock}
          label="Pending bookings"
          value={String(data.pendingBookings)}
          highlight={data.pendingBookings > 0}
        />
        <StatCard
          icon={Users}
          label="Total customers"
          value={String(data.totalCustomers)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 font-semibold text-white">
            Recent bookings
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      No bookings yet.
                    </td>
                  </tr>
                ) : (
                  data.recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(booking.event_date, 'dd MMM yyyy')}
                        <span className="block text-xs text-muted">
                          {formatTime(booking.start_time)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{booking.customer?.full_name || '—'}</td>
                      <td className="px-4 py-3">
                        {booking.event_type}
                        <span className="block text-xs text-muted">{booking.venue_city}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3">
                        {booking.customer?.cell_number && (
                          <WhatsAppButton cell={booking.customer.cell_number} name={booking.customer.full_name} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 font-semibold text-white">
            Recent music sales
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      No sales yet.
                    </td>
                  </tr>
                ) : (
                  data.recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(sale.paid_at || sale.created_at, 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">{sale.customer?.full_name || '—'}</td>
                      <td className="px-4 py-3">
                        {sale.track?.title || sale.bundle?.name || '—'}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(sale.amount_paid)}</td>
                      <td className="px-4 py-3">
                        {sale.customer?.cell_number && (
                          <WhatsAppButton cell={sale.customer.cell_number} name={sale.customer.full_name} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

const StatCard = ({ icon: Icon, label, value, highlight }) => (
  <div
    className={`rounded-lg border border-border bg-surface p-4 ${
      highlight ? 'ring-1 ring-warning/50' : ''
    }`}
  >
    <div className="mb-2 flex items-center gap-2 text-muted">
      <Icon className="h-4 w-4" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
    <p className="font-display text-2xl tracking-wide text-white">{value}</p>
  </div>
)

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
      BOOKING_STATUS_STYLES[status] || 'bg-surface-2 text-muted'
    }`}
  >
    {status?.replace(/_/g, ' ')}
  </span>
)

const WhatsAppButton = ({ cell, name }) => {
  const message = name ? `Hi ${name}, ` : ''
  const url = buildWhatsAppUrl(cell, message)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-lg bg-success/10 p-2 text-success transition hover:bg-success/20"
      aria-label={`WhatsApp ${name || 'customer'}`}
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
    </a>
  )
}

export default Dashboard
