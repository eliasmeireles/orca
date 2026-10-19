import { useEffect, useState } from 'react'
import {
  onPcTransferDialogRequest,
  type PcTransferDialogRequest
} from './pc-transfer-dialog-request'
import { PcTransferReceiveDialog } from './pc-transfer-receive-dialog'
import { PcTransferSendDialog } from './pc-transfer-send-dialog'

/** Owns the send/receive dialogs that sidebar entry points request. */
export function PcTransferDialogHost(): React.JSX.Element | null {
  const [request, setRequest] = useState<PcTransferDialogRequest | null>(null)
  useEffect(() => onPcTransferDialogRequest(setRequest), [])
  const close = (): void => setRequest(null)
  if (request?.mode === 'send') {
    return <PcTransferSendDialog open onClose={close} sourceWorkspace={request.workspace} />
  }
  if (request?.mode === 'receive') {
    return <PcTransferReceiveDialog open onClose={close} />
  }
  return null
}
