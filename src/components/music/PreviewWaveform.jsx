const PreviewWaveform = ({ playing }) => {
  const bars = [0.35, 0.55, 0.75, 0.5, 0.9, 0.6, 0.4]

  return (
    <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={index}
          className={[
            'w-1 rounded-full bg-accent transition-all duration-150',
            playing ? 'animate-pulse' : 'opacity-60',
          ].join(' ')}
          style={{
            height: playing ? `${height * 100}%` : '35%',
            animationDelay: `${index * 0.08}s`,
          }}
        />
      ))}
    </div>
  )
}

export default PreviewWaveform
