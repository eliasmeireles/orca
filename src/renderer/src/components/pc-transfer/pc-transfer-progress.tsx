import { Progress } from '@/components/ui/progress'
import { translate } from '@/i18n/i18n'
import type { AgentTransferProgress } from '../../../../shared/rpc-contract/agent-transfer-params'

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB']

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return '0 B'
  }
  const unit = Math.min(BYTE_UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${Number.parseFloat((bytes / 1024 ** unit).toFixed(1))} ${BYTE_UNITS[unit]}`
}

export function PcTransferProgress({ progress }: { progress: AgentTransferProgress }) {
  const percentage =
    progress.totalBytes > 0 ? Math.round((progress.sentBytes / progress.totalBytes) * 100) : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{translate('auto.components.pcTransfer.progress.sending', 'Sending chat')}</span>
        <span>{percentage}%</span>
      </div>
      <Progress value={percentage} />
      <span className="text-xs text-muted-foreground">
        {formatBytes(progress.sentBytes)} / {formatBytes(progress.totalBytes)}
      </span>
    </div>
  )
}
