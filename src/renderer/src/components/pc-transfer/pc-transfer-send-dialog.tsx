import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { AddRemoteHostDialog } from '@/components/sidebar/AddRemoteHostDialog'
import { translate } from '@/i18n/i18n'
import { PcTransferProgress } from './pc-transfer-progress'
import { PcTransferSelectField } from './pc-transfer-select-field'
import { isTransferableAgent } from './transferable-chat-lookup'
import { useAgentTransferSend } from './use-agent-transfer-send'
import { usePairedPcs, useRemoteWorkspaces, useTransferableChats } from './use-pc-transfer-targets'

type PcTransferSendDialogProps = {
  open: boolean
  onClose: () => void
  sourceWorkspace: { path: string; name: string }
}

export function PcTransferSendDialog({
  open,
  onClose,
  sourceWorkspace
}: PcTransferSendDialogProps) {
  const [pairing, setPairing] = useState(false)
  const [pcId, setPcId] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const { pcs, reload } = usePairedPcs(open)
  const { workspaces, error: workspacesError } = useRemoteWorkspaces(pcId)
  const chats = useTransferableChats(open, sourceWorkspace.path)
  const transfer = useAgentTransferSend()
  const chat = chats?.find((candidate) => candidate.id === chatId) ?? null

  const handleClose = (): void => {
    transfer.reset()
    onClose()
  }

  const handleSend = (): void => {
    if (!pcId || !targetId || !chat || !isTransferableAgent(chat.agent)) {
      return
    }
    void transfer.send({
      environmentId: pcId,
      agent: chat.agent,
      providerSessionId: chat.sessionId,
      sourceCwd: sourceWorkspace.path,
      targetWorktreeId: targetId,
      title: chat.title
    })
  }

  const sending = transfer.status === 'sending'
  return (
    <>
      <Dialog open={open && !pairing} onOpenChange={(next) => !next && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {translate('auto.components.pcTransfer.send.title', 'Send to another PC')}
            </DialogTitle>
            <DialogDescription>
              {translate(
                'auto.components.pcTransfer.send.description',
                'Sends a chat from {{value0}} with its full history. The other PC can continue it where it stopped.',
                { value0: sourceWorkspace.name }
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <PcTransferSelectField
              id="pc-transfer-pc"
              label={translate('auto.components.pcTransfer.send.pcLabel', 'Destination PC')}
              placeholder={translate(
                'auto.components.pcTransfer.send.pcPlaceholder',
                'Choose a paired PC'
              )}
              value={pcId}
              options={pcs.map((pc) => ({ value: pc.id, label: pc.name }))}
              onChange={(value) => {
                setPcId(value)
                setTargetId(null)
              }}
              disabled={sending}
              hint={
                <Button
                  variant="ghost"
                  size="xs"
                  className="self-start"
                  onClick={() => setPairing(true)}
                >
                  <Plus />
                  {translate('auto.components.pcTransfer.send.pairNew', 'Pair a new PC')}
                </Button>
              }
            />
            <PcTransferSelectField
              id="pc-transfer-workspace"
              label={translate(
                'auto.components.pcTransfer.send.workspaceLabel',
                'Destination workspace'
              )}
              placeholder={translate(
                'auto.components.pcTransfer.send.workspacePlaceholder',
                'Choose a workspace on that PC'
              )}
              value={targetId}
              options={workspaces.map((workspace) => ({
                value: workspace.id,
                label: `${workspace.displayName} — ${workspace.path}`
              }))}
              onChange={setTargetId}
              disabled={!pcId || sending}
              hint={
                workspacesError ? (
                  <span className="text-xs text-destructive">{workspacesError}</span>
                ) : null
              }
            />
            <PcTransferSelectField
              id="pc-transfer-chat"
              label={translate('auto.components.pcTransfer.send.chatLabel', 'Chat')}
              placeholder={
                chats === null
                  ? translate('auto.components.pcTransfer.send.chatsLoading', 'Loading chats…')
                  : translate('auto.components.pcTransfer.send.chatPlaceholder', 'Choose a chat')
              }
              value={chatId}
              options={(chats ?? []).map((candidate) => ({
                value: candidate.id,
                label: `${candidate.title} — ${candidate.agent}`
              }))}
              onChange={setChatId}
              disabled={!chats?.length || sending}
              hint={
                chats?.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {translate(
                      'auto.components.pcTransfer.send.noChats',
                      'No Claude or Codex chats in this workspace yet.'
                    )}
                  </span>
                ) : null
              }
            />

            {transfer.progress && sending ? (
              <PcTransferProgress progress={transfer.progress} />
            ) : null}
            {transfer.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {transfer.error}
              </div>
            ) : null}
            {transfer.status === 'done' ? (
              <div className="rounded-md border p-3 text-xs">
                {translate(
                  'auto.components.pcTransfer.send.done',
                  'Chat sent. The other PC shows a notice to open it.'
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {translate('auto.components.pcTransfer.close', 'Close')}
            </Button>
            <Button onClick={handleSend} disabled={!pcId || !targetId || !chat || sending}>
              {translate('auto.components.pcTransfer.send.send', 'Send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddRemoteHostDialog
        mode={pairing ? 'server' : null}
        onOpenChange={(mode) => {
          if (mode === null) {
            setPairing(false)
            void reload()
          }
        }}
      />
    </>
  )
}
