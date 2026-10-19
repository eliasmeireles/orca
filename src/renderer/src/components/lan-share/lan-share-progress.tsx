'use client'

type LanShareProgressProps = {
  progress: { transferredBytes: number; totalBytes: number; percentage: number } | null
}

export function LanShareProgress({ progress }: LanShareProgressProps) {
  if (!progress) {
    return null
  }

  const { transferredBytes, totalBytes, percentage } = progress

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Transferindo processo</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-input rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {formatBytes(transferredBytes)} / {formatBytes(totalBytes)}
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}
