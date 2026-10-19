import { useEffect, useRef } from 'react'
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
import { LanShareAddressRow } from './lan-share-address-row'

type LanShareReceiveModalProps = {
  open: boolean
  onClose: () => void
}

export function LanShareReceiveModal({ open, onClose }: LanShareReceiveModalProps) {
  const { state, config, otp, peer, error, startReceiver, stopReceiver } = useLanShare()
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

  const running = state !== 'idle'

  // Why: the server only lives while this modal is open, so closing it must stop listening.
  const handleClose = (): void => {
    void stopReceiver()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {translate('auto.components.lanShare.receive.title', 'Receive transfer')}
          </DialogTitle>
          <DialogDescription>
            {translate(
              'auto.components.lanShare.receive.description',
              'Enter one of the addresses and the OTP code below on the sending PC.'
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
              <LanShareAddressRow key={ip} address={`${ip}:${config?.listenPort ?? ''}`} />
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
          <Button variant="outline" onClick={handleClose}>
            {translate('auto.components.lanShare.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
