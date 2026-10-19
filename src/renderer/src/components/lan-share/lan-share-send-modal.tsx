'use client'

import { useState } from 'react'
import { useLanShare } from './use-lan-share'
import { LanShareProgress } from './lan-share-progress'

type LanShareSendModalProps = {
  open: boolean
  onClose: () => void
}

export function LanShareSendModal({ open, onClose }: LanShareSendModalProps) {
  const { state, connectSender, submitOTP, transferPty, close, progress, error, otpAccepted } =
    useLanShare()
  const [configText, setConfigText] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [ptyId, setPtyId] = useState('')

  const handleConnect = async (): Promise<void> => {
    try {
      const config = JSON.parse(atob(configText))
      await connectSender(config)
    } catch {
      // invalid config
    }
  }

  const handleSubmitOTP = async (): Promise<void> => {
    await submitOTP(otpInput)
  }

  const handleTransferPty = async (): Promise<void> => {
    await transferPty(ptyId)
  }

  if (!open) {
    return null
  }

  const awaitingOTP = state === 'sender_otp_pending' || state === 'sender_connecting'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background border border-input rounded-lg p-6 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            LS
          </div>
          <h2 className="text-lg font-semibold text-foreground">Enviar transferência</h2>
        </div>

        {state === 'idle' || state === 'sender_connecting' ? (
          <>
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Cole a config do PC destino (base64)
              </label>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                className="w-full h-24 bg-input border border-input rounded-lg px-3 py-2 text-sm font-mono text-foreground resize-none"
                placeholder="Cole aqui o código base64 copiado do PC destino"
              />
            </div>

            <button
              onClick={handleConnect}
              disabled={!configText.trim()}
              className="w-full bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90"
            >
              Conectar
            </button>
          </>
        ) : null}

        {awaitingOTP && (
          <>
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Informe o OTP exibido no PC destino
              </label>
              <input
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                className="w-full bg-input border border-input rounded-lg px-3 py-2 text-sm font-mono text-foreground text-center"
                placeholder="000000"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmitOTP}
                disabled={otpInput.length !== 6}
                className="flex-1 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Confirmar OTP
              </button>
              <button
                onClick={close}
                className="flex-1 bg-input text-foreground rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {otpAccepted && state !== 'transferring' && state !== 'completed' && (
          <>
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                ID do PTY para transferir
              </label>
              <input
                value={ptyId}
                onChange={(e) => setPtyId(e.target.value)}
                className="w-full bg-input border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                placeholder="cole o id do PTY"
              />
            </div>

            <button
              onClick={handleTransferPty}
              disabled={!ptyId}
              className="w-full bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90"
            >
              Transferir PTY
            </button>
          </>
        )}

        {state === 'transferring' && (
          <div className="mt-4">
            <LanShareProgress progress={progress} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
            {error.message}
          </div>
        )}

        {state === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-800">
            Transferência concluída com sucesso.
          </div>
        )}
      </div>
    </div>
  )
}
