import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '../../lib/phone'
import Button from './Button'

const WhatsAppBtn = ({
  phone,
  message = '',
  label = 'WhatsApp',
  variant = 'secondary',
  size = 'sm',
  iconOnly = false,
  className = '',
}) => {
  if (!phone) return null

  const handleClick = () => {
    window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={[
        iconOnly ? 'min-w-touch px-3' : '',
        'border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      aria-label={iconOnly ? label : undefined}
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {!iconOnly ? label : null}
    </Button>
  )
}

export default WhatsAppBtn
