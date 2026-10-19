import { Download, Upload } from 'lucide-react'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import { requestPcTransferDialog } from '@/components/pc-transfer/pc-transfer-dialog-request'
import {
  getWorktreeExecutionHostId,
  LOCAL_EXECUTION_HOST_ID
} from '../../../../shared/execution-host'
import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'

type WorktreePcTransferMenuItemsProps = {
  worktree: Pick<Worktree, 'hostId' | 'path' | 'displayName'>
  repo: Pick<Repo, 'connectionId' | 'executionHostId'> | undefined
  disabled: boolean
}

/** Send/receive entries; only this PC's own workspaces have transcripts here to send. */
export function WorktreePcTransferMenuItems({
  worktree,
  repo,
  disabled
}: WorktreePcTransferMenuItemsProps): React.JSX.Element | null {
  if (getWorktreeExecutionHostId(worktree, repo) !== LOCAL_EXECUTION_HOST_ID) {
    return null
  }
  return (
    <>
      <DropdownMenuItem
        disabled={disabled}
        onSelect={() =>
          requestPcTransferDialog({
            mode: 'send',
            workspace: { path: worktree.path, name: worktree.displayName }
          })
        }
      >
        <Upload className="size-3.5" />
        {translate(
          'auto.components.sidebar.WorktreeContextMenu.sendTransfer',
          'Send to another PC'
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={disabled}
        onSelect={() => requestPcTransferDialog({ mode: 'receive' })}
      >
        <Download className="size-3.5" />
        {translate(
          'auto.components.sidebar.WorktreeContextMenu.receiveTransfer',
          'Receive from another PC'
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  )
}
