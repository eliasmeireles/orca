import type React from 'react'
import { Download, Share2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import { requestPcTransferDialog } from '@/components/pc-transfer/pc-transfer-dialog-request'
import {
  handleRepoHeaderActionPointerDown,
  stopRepoHeaderKeyboardToggle,
  stopRepoHeaderMenuEvent
} from './header-event-guards'

/** Project-header entry for sending this project's main checkout chats to another PC. */
export function RepoHeaderPcTransferMenu({
  label,
  repoPath
}: {
  label: string
  repoPath: string
}): React.JSX.Element {
  // Why: hover-reveal lives on the wrapper so <Button> keeps its ghost variant; has-[[data-state=open]] keeps it shown while the menu is open.
  return (
    <span className="inline-flex shrink-0 min-w-0 max-w-0 -ml-1.5 overflow-hidden opacity-0 transition-[margin,max-width,opacity] focus-within:ml-0 focus-within:max-w-5 focus-within:opacity-100 group-hover:ml-0 group-hover:max-w-5 group-hover:opacity-100 has-[[data-state=open]]:ml-0 has-[[data-state=open]]:max-w-5 has-[[data-state=open]]:opacity-100">
      <DropdownMenu modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5"
                data-repo-header-action=""
                aria-label={translate(
                  'auto.components.sidebar.WorktreeList.pcTransferFor',
                  'Transfer {{value0}} to another PC',
                  { value0: label }
                )}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={stopRepoHeaderKeyboardToggle}
                onPointerDown={handleRepoHeaderActionPointerDown}
              >
                <Share2 className="size-3" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {translate('auto.components.sidebar.WorktreeList.pcTransfer', 'Transfer to another PC')}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          onPointerDown={stopRepoHeaderMenuEvent}
          onMouseDown={stopRepoHeaderMenuEvent}
          onPointerUp={stopRepoHeaderMenuEvent}
          onMouseUp={stopRepoHeaderMenuEvent}
          onClick={stopRepoHeaderMenuEvent}
          onKeyDown={stopRepoHeaderMenuEvent}
        >
          <DropdownMenuItem
            onSelect={() =>
              requestPcTransferDialog({ mode: 'send', workspace: { path: repoPath, name: label } })
            }
          >
            <Upload className="size-3.5" />
            {translate(
              'auto.components.sidebar.WorktreeContextMenu.sendTransfer',
              'Send to another PC'
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => requestPcTransferDialog({ mode: 'receive' })}>
            <Download className="size-3.5" />
            {translate(
              'auto.components.sidebar.WorktreeContextMenu.receiveTransfer',
              'Receive from another PC'
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
