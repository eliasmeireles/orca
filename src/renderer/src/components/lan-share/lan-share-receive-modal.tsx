import { useEffect, useRef, useState } from 'react'
import { Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { translate } from '@/i18n/i18n'
import { useLanShare } from './use-lan-share'

type LanShareReceiveModalProps = {
  open: boolean
  onClose: () => void
}

const COPIED_FEEDBACK_MS = 2000

export function LanShareReceiveModal({ open, onClose }: LanShareReceiveModalProps) {
  const { state, config, otp, peer, error, startReceiver, stopReceiver } = useLanShare()
  const [copied, setCopied] = useState(false)
  const autoStartedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      autoStartedRef.current = false
      return
    }
    if (autoStartedRef.current) {
      return
    }
    autoStartedRef.current = true
    void startReceiver().catch(() => {})
  }, [open, startReceiver])

  const configBase64 = config ? btoa(JSON.stringify(config)) : ''
  const running = state !== 'idle'

  const handleCopy = async (): Promise<void> => {
    if (!configBase64) {
      return
    }
    await navigator.clipboard.writeText(configBase64)
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {translate('auto.components.lanShare.receive.title', 'Receive transfer')}
          </DialogTitle>
          <DialogDescription>
            {translate(
              'auto.components.lanShare.receive.description',
              'Share the config and OTP code below with the sending PC.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{translate('auto.components.lanShare.receive.otpLabel', 'OTP code')}</Label>
            <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2">
              <span className="font-mono text-lg font-semibold">{otp ?? '—'}</span>
              {state === 'receiver_otp_challenge' ? (
                <span className="text-xs text-muted-foreground">
                  {translate(
                    'auto.components.lanShare.receive.otpHint',
                    'Enter it on the sending PC'
                  )}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              {translate(
                'auto.components.lanShare.receive.addressesLabel',
                'Available addresses (IP:PORT)'
              )}
            </Label>
            {(config?.ips ?? []).map((ip) => (
              <div
                key={ip}
                className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
              >
                <span className="font-mono">
                  {ip}:{config?.listenPort ?? '—'}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => navigator.clipboard.writeText(`${ip}:${config?.listenPort ?? ''}`)}
                >
                  {translate('auto.components.lanShare.receive.copy', 'Copy')}
                </Button>
              </div>
            ))}
            {config && config.ips.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {translate('auto.components.lanShare.receive.noIps', 'No local IP address found')}
              </span>
            ) : null}
            {!config && running ? (
              <span className="text-xs text-muted-foreground">
                {translate('auto.components.lanShare.receive.starting', 'Starting server…')}
              </span>
            ) : null}
          </div>

          <Button variant="outline" onClick={handleCopy} disabled={!configBase64}>
            <Clipboard className="size-3.5" />
            {copied
              ? translate('auto.components.lanShare.receive.copied', 'Config copied')
              : translate('auto.components.lanShare.receive.copyConfig', 'Copy config (base64)')}
          </Button>

          {config ? (
            <div className="flex flex-col gap-1 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <span>
                {translate('auto.components.lanShare.receive.device', 'Device: {{value0}}', {
                  value0: config.deviceName
                })}
              </span>
              <span>
                {translate(
                  'auto.components.lanShare.receive.otpExpires',
                  'OTP expires at {{value0}}',
                  {
                    value0: new Date(config.otpExpiresAt ?? 0).toLocaleTimeString()
                  }
                )}
              </span>
            </div>
          ) : null}

          {peer ? (
            <div className="rounded-md border p-3 text-xs">
              {translate('auto.components.lanShare.receive.connected', 'Connected to {{value0}}', {
                value0: peer.deviceName
              })}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error.message}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {running ? (
            <Button variant="destructive" onClick={() => void stopReceiver()}>
              {translate('auto.components.lanShare.receive.stop', 'Stop server')}
            </Button>
          ) : (
            <Button onClick={() => void startReceiver().catch(() => {})}>
              {translate('auto.components.lanShare.receive.start', 'Start server')}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {translate('auto.components.lanShare.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
