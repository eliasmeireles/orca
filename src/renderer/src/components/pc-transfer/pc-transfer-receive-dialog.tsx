import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { RuntimePairingUrlGenerator } from '@/components/settings/RuntimePairingUrlGenerator'
import { translate } from '@/i18n/i18n'

type PcTransferReceiveDialogProps = {
  open: boolean
  onClose: () => void
}

/**
 * Receiving needs no listener of its own: this PC's Orca server accepts transfers from any PC
 * it paired with, so the dialog only hands out a pairing link. Arrivals are announced by
 * AgentTransferReceivedGate.
 */
export function PcTransferReceiveDialog({ open, onClose }: PcTransferReceiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {translate('auto.components.pcTransfer.receive.title', 'Receive from another PC')}
          </DialogTitle>
          <DialogDescription>
            {translate(
              'auto.components.pcTransfer.receive.description',
              'Create a pairing link and paste it on the other PC under "Send to another PC". Once paired, chats it sends appear here automatically.'
            )}
          </DialogDescription>
        </DialogHeader>
        <RuntimePairingUrlGenerator framed={false} showHeader={false} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {translate('auto.components.pcTransfer.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
