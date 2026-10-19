import React, { useState } from 'react'
import { createPortal } from 'react-dom'
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
import { LanShareReceiveModal, LanShareSendModal } from '@/components/lan-share'
import {
  handleRepoHeaderActionPointerDown,
  stopRepoHeaderKeyboardToggle,
  stopRepoHeaderMenuEvent
} from './header-event-guards'

type LanShareModal = 'send' | 'receive' | null

export function RepoHeaderLanShareMenu({ label }: { label: string }): React.JSX.Element {
  const [modal, setModal] = useState<LanShareModal>(null)
  const closeModal = (): void => setModal(null)
  return (
    <>
      {/* Why: hover-reveal lives on the wrapper so <Button> keeps its ghost variant; has-[[data-state=open]] keeps it shown while the menu is open. */}
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
                    'auto.components.sidebar.WorktreeList.lanShareFor',
                    'Share {{value0}} over LAN',
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
              {translate('auto.components.sidebar.WorktreeList.lanShare', 'LAN transfer')}
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
            <DropdownMenuItem onSelect={() => setModal('send')}>
              <Upload className="size-3.5" />
              {translate(
                'auto.components.sidebar.WorktreeContextMenu.sendTransfer',
                'Send to another PC'
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setModal('receive')}>
              <Download className="size-3.5" />
              {translate(
                'auto.components.sidebar.WorktreeContextMenu.receiveTransfer',
                'Receive from another PC'
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
      {/* Why: virtual rows are transformed, which would trap the modals' fixed overlay inside the row; portals also still bubble React events, so stop them before they toggle/drag the header. */}
      {modal
        ? createPortal(
            <div
              onPointerDown={stopRepoHeaderMenuEvent}
              onMouseDown={stopRepoHeaderMenuEvent}
              onClick={stopRepoHeaderMenuEvent}
              onKeyDown={stopRepoHeaderMenuEvent}
            >
              <LanShareSendModal open={modal === 'send'} onClose={closeModal} />
              <LanShareReceiveModal open={modal === 'receive'} onClose={closeModal} />
            </div>,
            document.body
          )
        : null}
    </>
  )
}
