'use client'

import { useState } from 'react'
import { useLanShare } from './use-lan-share'

type LanShareReceiveModalProps = {
  open: boolean
  onClose: () => void
}

export function LanShareReceiveModal({ open, onClose }: LanShareReceiveModalProps) {
  const { state, config, otp, peer, startReceiver, stopReceiver, getLocalIPs } = useLanShare()
  const [copyMessage, setCopyMessage] = useState('')

  const configBase64 = config ? btoa(JSON.stringify(config)) : ''

  const handleCopy = async (): Promise<void> => {
    if (!configBase64) {
      return
    }
    await navigator.clipboard.writeText(configBase64)
    setCopyMessage('Config copiada!')
    setTimeout(() => setCopyMessage(''), 2000)
  }

  const handleStart = async (): Promise<void> => {
    await getLocalIPs()
    await startReceiver()
  }

  if (!open) {
    return null
  }

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
          <h2 className="text-lg font-semibold text-foreground">Receber transferência</h2>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Código OTP</label>
          <div className="flex items-center justify-between bg-input border border-input rounded-lg px-3 py-2 text-lg font-mono text-foreground">
            <span className="font-bold text-primary">{otp ?? '—'}</span>
            {state === 'receiver_otp_challenge' && (
              <span className="text-xs text-muted-foreground">informe no PC remetente</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Endereços disponíveis (IP:PORTA)
          </label>
          <div className="space-y-2">
            {(config?.ips ?? []).map((ip: string) => (
              <div
                key={ip}
                className="flex items-center justify-between bg-input border border-input rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <span className="font-mono">
                  {ip}:{config?.listenPort ?? '—'}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(`${ip}:${config?.listenPort ?? ''}`)}
                  className="text-xs text-primary hover:underline"
                >
                  Copiar
                </button>
              </div>
            ))}
            {config?.ips?.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhum IP local encontrado</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={handleCopy}
            disabled={!configBase64}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm disabled:opacity-50"
          >
            {copyMessage ? (
              <span className="text-green-600 text-xs font-medium">{copyMessage}</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copiar config (base64)
              </>
            )}
          </button>
        </div>

        {config && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <div className="mb-1">Dispositivo: {config.deviceName}</div>
            <div className="mb-1">ID: {config.deviceId}</div>
            <div className="mb-1">Porta: {config.listenPort ?? '—'}</div>
            <div>OTP expira em: {new Date(config.otpExpiresAt ?? 0).toLocaleTimeString()}</div>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {state === 'idle' ? (
            <button
              onClick={handleStart}
              className="flex-1 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/90"
            >
              Iniciar servidor
            </button>
          ) : (
            <button
              onClick={stopReceiver}
              className="flex-1 bg-destructive text-destructive-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-destructive/90"
            >
              Parar servidor
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-input text-foreground rounded-lg px-3 py-2 text-sm hover:bg-muted"
          >
            Fechar
          </button>
        </div>

        {peer && (
          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-800">
            Conectado com {peer.deviceName} ({peer.deviceId})
          </div>
        )}
      </div>
    </div>
  )
}
