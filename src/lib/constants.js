export const EVENT_TYPES = [
  'Birthday Party',
  'Corporate Event',
  'Tavern Night',
  'Wedding',
  'Festival',
  'Other',
]

export const CROWD_SIZES = [
  { value: 'under_50', labelEn: 'Under 50', labelXh: 'Ngaphantsi kwe-50' },
  { value: '50_200', labelEn: '50–200', labelXh: '50–200' },
  { value: '200_500', labelEn: '200–500', labelXh: '200–500' },
  { value: '500_plus', labelEn: '500+', labelXh: '500+' },
]

export const TRACK_CATEGORIES = {
  full_song: { en: 'Full Song', xh: 'Ingoma epheleleyo' },
  stem: { en: 'Stem', xh: 'Istem' },
}

export const BOOKING_STATUSES = [
  'pending',
  'deposit_requested',
  'deposit_paid',
  'confirmed',
  'completed',
  'cancelled',
]

export const PURCHASE_STATUSES = ['pending', 'paid']

export const CLASH_ERROR_XH =
  'Le slot sele ibhukiwe. Nceda ukhethe ixesha elinye okanye umhla omtsha.'

export const CLASH_ERROR_EN =
  'This time slot is already booked. Please choose another time or date.'

export const MIN_DISCOUNT_PRICE = 1.0

export const SA_TIMEZONE = 'Africa/Johannesburg'

export const BASE_CITY_ALIASES = ['Queenstown', 'Komani']
