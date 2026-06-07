const currencyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
})

export const formatCurrency = (amount: number | string) =>
  currencyFormatter.format(Number(amount))

const xhMonths = [
  'Janyuwari',
  'Februwari',
  'Mashi',
  'Epreli',
  'Meyi',
  'Juni',
  'Julayi',
  'Agasti',
  'Septemba',
  'Okthoba',
  'Novemba',
  'Disemba',
]

export const formatDateXh = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  const day = date.getUTCDate()
  const month = xhMonths[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  return `${day} ${month} ${year}`
}

export const formatDateEn = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  }).format(date)
}

export const formatTime = (value: string) => value.slice(0, 5)

export const crowdSizeLabelXh = (value: string) => {
  const labels: Record<string, string> = {
    under_50: 'Ngaphantsi kwe-50',
    '50_200': '50–200',
    '200_500': '200–500',
    '500_plus': '500+',
  }
  return labels[value] ?? value
}

export const appUrl = () =>
  Deno.env.get('APP_URL') ?? Deno.env.get('VITE_APP_URL') ?? 'https://djntsira.co.za'

export const djEmail = () => Deno.env.get('DJ_EMAIL') ?? 'djntsira@gmail.com'

export const fromEmail = () =>
  Deno.env.get('RESEND_FROM_EMAIL') ?? 'DJ Ntsira <bookings@djntsira.co.za>'
