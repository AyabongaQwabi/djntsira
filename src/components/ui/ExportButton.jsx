import { Download } from 'lucide-react'
import { exportToXlsx } from '../../lib/export'
import Button from './Button'

const ExportButton = ({
  data = [],
  filename = 'export',
  columnMap = null,
  label = 'Export',
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const handleExport = () => {
    if (!data.length) return
    exportToXlsx(data, filename, columnMap)
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || !data.length}
      onClick={handleExport}
    >
      <Download className="h-5 w-5" aria-hidden="true" />
      {label}
    </Button>
  )
}

export default ExportButton
