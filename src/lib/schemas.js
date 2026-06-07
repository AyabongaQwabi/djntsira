import { z } from 'zod'
import { isValidSAPhone } from './phone'

const saPhone = z
  .string()
  .min(1, 'Phone number is required')
  .refine(isValidSAPhone, 'Enter a valid SA number (e.g. 083 123 4567)')

const email = z.string().min(1, 'Email is required').email('Invalid email address')

export const customerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  cell_number: saPhone,
  email,
})

export const purchaseSchema = customerSchema.extend({
  track_id: z.string().uuid().optional(),
  bundle_id: z.string().uuid().optional(),
  amount_paid: z.number().positive(),
})

export const bookingSchema = z
  .object({
    full_name: z.string().min(2),
    cell_number: saPhone,
    email,
    event_type: z.string().min(1, 'Select an event type'),
    venue_name: z.string().min(2),
    venue_city: z.string().min(2),
    crowd_size: z.enum(['under_50', '50_200', '200_500', '500_plus']),
    event_date: z.string().min(1),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    is_night: z.boolean(),
    hours_booked: z
      .number()
      .int('Hours must be whole numbers')
      .min(1, 'Minimum 1 hour')
      .max(12, 'Maximum 12 hours'),
    notes: z.string().optional(),
    hospitality_acknowledged: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm hospitality requirements' }),
    }),
  })
  .refine(
    (data) => data.end_time > data.start_time,
    { message: 'End time must be after start time', path: ['end_time'] }
  )

export const trackUploadSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['full_song', 'stem']),
  price: z.number().positive(),
  preview_duration: z.number().int().min(5).max(30),
  discount_type: z.enum(['percent', 'flat']).nullable().optional(),
  discount_value: z.number().nonnegative().nullable().optional(),
  discount_expires_at: z.string().nullable().optional(),
  published: z.boolean().default(false),
})

export const bundleSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  track_ids: z.array(z.string().uuid()).min(1, 'Select at least one track'),
  discount_type: z.enum(['percent', 'flat']).nullable().optional(),
  discount_value: z.number().nonnegative().nullable().optional(),
  discount_expires_at: z.string().nullable().optional(),
  published: z.boolean().default(false),
})

export const settingsSchema = z.object({
  day_rate: z.number().positive('Day rate must be positive'),
  night_rate: z.number().positive('Night rate must be positive'),
  night_start_hour: z.number().int().min(0).max(23),
  deposit_percent: z.number().int().min(10).max(100),
  transport_threshold_km: z.number().int().positive(),
  transport_base_fee: z.number().nonnegative(),
  travel_buffer_hours: z.number().int().min(1).max(6),
  download_expiry_days: z.number().int().min(1).max(30),
  hospitality_text_xh: z.string().min(1),
  hospitality_text_en: z.string().min(1),
})

export const marketingEmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  segment: z.enum(['all_bookers', 'date_range']),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
