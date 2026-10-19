export type PcTransferDialogRequest =
  | { mode: 'send'; workspace: { path: string; name: string } }
  | { mode: 'receive' }

const PC_TRANSFER_DIALOG_EVENT = 'orca:pc-transfer-dialog'

// Why: entry points live inside menus and virtualized rows that unmount on close or scroll,
// so the dialogs are owned by one app-level host instead.
export function requestPcTransferDialog(request: PcTransferDialogRequest): void {
  window.dispatchEvent(new CustomEvent(PC_TRANSFER_DIALOG_EVENT, { detail: request }))
}

export function onPcTransferDialogRequest(
  listener: (request: PcTransferDialogRequest) => void
): () => void {
  const handler = (event: Event): void => {
    if (event instanceof CustomEvent && isPcTransferDialogRequest(event.detail)) {
      listener(event.detail)
    }
  }
  window.addEventListener(PC_TRANSFER_DIALOG_EVENT, handler)
  return () => window.removeEventListener(PC_TRANSFER_DIALOG_EVENT, handler)
}

function isPcTransferDialogRequest(value: unknown): value is PcTransferDialogRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mode' in value &&
    (value.mode === 'send' || value.mode === 'receive')
  )
}
