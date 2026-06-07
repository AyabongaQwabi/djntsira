import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Mail,
  Music2,
  Settings,
  Users,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/music', label: 'Music', icon: Music2 },
  { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/marketing', label: 'Marketing', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

const linkClass = ({ isActive }) =>
  [
    'flex min-h-touch items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent/15 text-accent'
      : 'text-muted hover:bg-surface-2 hover:text-[var(--color-text)]',
  ].join(' ')

const mobileLinkClass = ({ isActive }) =>
  [
    'flex min-h-touch flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium',
    isActive ? 'text-accent' : 'text-muted',
  ].join(' ')

const AdminLayout = () => {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="DJ Ntsira"
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="font-display text-lg text-accent">DJ NTSIRA</p>
              <p className="text-xs text-muted">Admin</p>
            </div>
          </div>
          {user?.email ? (
            <p className="mt-3 truncate text-xs text-muted">{user.email}</p>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Admin navigation">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={handleLogout}
            className="justify-start"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Log Out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="font-display text-lg text-accent">Admin</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 pb-24 lg:pb-4">
          <Outlet />
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-40 overflow-x-auto border-t border-border bg-surface lg:hidden"
          aria-label="Admin mobile navigation"
        >
          <div className="flex min-w-max">
            {navItems.map(({ to, end, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={mobileLinkClass}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default AdminLayout
