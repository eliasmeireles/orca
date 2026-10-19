'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { LanShareReceiveModal } from './lan-share-receive-modal'
import { LanShareSendModal } from './lan-share-send-modal'

type LanShareMode = 'idle' | 'receive' | 'send'

type LanShareShareButtonProps = {
  label?: string
}

export function LanShareShareButton({ label = 'Share' }: LanShareShareButtonProps) {
  const [mode, setMode] = useState<LanShareMode>('idle')
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setMode('idle')}
        className="flex items-center gap-2 bg-input border border-input rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
      >
        <Share2 size={14} />
        {label}
      </button>

      {mode === 'idle' && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-border border border-input rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Transferência LAN
          </div>
          <button
            onClick={() => {
              setMode('receive')
              setReceiveOpen(true)
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
          >
            <span>Receber transferência</span>
          </button>
          <button
            onClick={() => {
              setMode('send')
              setSendOpen(true)
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
          >
            <span>Enviar transferência</span>
          </button>
        </div>
      )}

      {receiveOpen && (
        <LanShareReceiveModal open={receiveOpen} onClose={() => setReceiveOpen(false)} />
      )}
      {sendOpen && <LanShareSendModal open={sendOpen} onClose={() => setSendOpen(false)} />}
    </div>
  )
}
