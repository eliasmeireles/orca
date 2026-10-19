import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'

const COPIED_FEEDBACK_MS = 2000

/** One receiver `IP:PORT` with a copy button that confirms the copy inline. */
export function LanShareAddressRow({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copied])

  // Why: navigator.clipboard rejects in the Electron renderer; the main-process clipboard does not.
  const handleCopy = async (): Promise<void> => {
    await window.api.ui.writeClipboardText(address)
    setCopied(true)
  }

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
      <span className="font-mono">{address}</span>
      <Button variant="ghost" size="xs" onClick={() => void handleCopy()}>
        {copied
          ? translate('auto.components.lanShare.receive.copied', 'Copied')
          : translate('auto.components.lanShare.receive.copy', 'Copy')}
      </Button>
    </div>
  )
}
