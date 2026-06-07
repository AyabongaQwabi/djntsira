import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/shared/ErrorBoundary'
import ProtectedRoute from './components/shared/ProtectedRoute'
import LoadingSpinner from './components/shared/LoadingSpinner'
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'

import Home from './pages/public/Home'
import Music from './pages/public/Music'
import TrackDetail from './pages/public/TrackDetail'
import Book from './pages/public/Book'
import BookingConfirmed from './pages/public/BookingConfirmed'
import PaymentSuccess from './pages/public/PaymentSuccess'
import PaymentCancel from './pages/public/PaymentCancel'
import PaymentFailure from './pages/public/PaymentFailure'
import SecureDownload from './pages/public/SecureDownload'

import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import MusicManager from './pages/admin/MusicManager'
import BookingsList from './pages/admin/BookingsList'
import BookingCalendar from './pages/admin/BookingCalendar'
import Customers from './pages/admin/Customers'
import Marketing from './pages/admin/Marketing'
import Settings from './pages/admin/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner fullScreen label="Loading…" />}>
              <Routes>
            {/* Public routes — wrapped in PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/music" element={<Music />} />
              <Route path="/music/:id" element={<TrackDetail />} />
              <Route path="/book" element={<Book />} />
              <Route path="/booking-confirmed" element={<BookingConfirmed />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />
              <Route path="/download/:token" element={<SecureDownload />} />
            </Route>

            {/* Admin auth — no layout */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin routes — protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="music" element={<MusicManager />} />
              <Route path="bookings" element={<BookingsList />} />
              <Route path="calendar" element={<BookingCalendar />} />
              <Route path="customers" element={<Customers />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="settings" element={<Settings />} />
            </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
