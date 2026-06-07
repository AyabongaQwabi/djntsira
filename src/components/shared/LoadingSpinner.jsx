import Spinner from '../ui/Spinner'

const LoadingSpinner = ({ size = 'md', label, className = '', fullScreen = false }) => {
  const content = (
    <Spinner size={size} label={label} className={className} />
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner
