import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { translate } from '@/i18n/i18n'
import { useLanShare } from './use-lan-share'
import { LanShareProgress } from './lan-share-progress'

type LanShareSendModalProps = {
  open: boolean
  onClose: () => void
}

const OTP_LENGTH = 6

export function LanShareSendModal({ open, onClose }: LanShareSendModalProps) {
  const { state, connectSender, submitOTP, transferPty, close, progress, error, otpAccepted } =
    useLanShare()
  const [configText, setConfigText] = useState('')
  const [configInvalid, setConfigInvalid] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [ptyId, setPtyId] = useState('')

  const handleConnect = async (): Promise<void> => {
    try {
      const config = JSON.parse(atob(configText.trim()))
      setConfigInvalid(false)
      await connectSender(config)
    } catch {
      setConfigInvalid(true)
    }
  }

  const awaitingConfig = state === 'idle' || state === 'sender_connecting'
  const awaitingOTP = state === 'sender_otp_pending' || state === 'sender_connecting'
  const readyToTransfer = otpAccepted && state !== 'transferring' && state !== 'completed'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {translate('auto.components.lanShare.send.title', 'Send transfer')}
          </DialogTitle>
          <DialogDescription>
            {translate(
              'auto.components.lanShare.send.description',
              'Paste the config copied from the receiving PC, then confirm its OTP code.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {awaitingConfig ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="lan-share-config">
                {translate(
                  'auto.components.lanShare.send.configLabel',
                  'Receiving PC config (base64)'
                )}
              </Label>
              <Textarea
                id="lan-share-config"
                value={configText}
                onChange={(event) => setConfigText(event.target.value)}
                variant="code"
                className="h-24 resize-none"
                placeholder={translate(
                  'auto.components.lanShare.send.configPlaceholder',
                  'Paste the base64 code copied from the receiving PC'
                )}
              />
              {configInvalid ? (
                <span className="text-xs text-destructive">
                  {translate('auto.components.lanShare.send.configInvalid', 'Invalid config')}
                </span>
              ) : null}
              <Button onClick={handleConnect} disabled={!configText.trim()}>
                {translate('auto.components.lanShare.send.connect', 'Connect')}
              </Button>
            </div>
          ) : null}

          {awaitingOTP ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="lan-share-otp">
                {translate(
                  'auto.components.lanShare.send.otpLabel',
                  'OTP code shown on the receiving PC'
                )}
              </Label>
              <Input
                id="lan-share-otp"
                value={otpInput}
                onChange={(event) => setOtpInput(event.target.value)}
                maxLength={OTP_LENGTH}
                className="text-center"
                placeholder="000000"
              />
              <Button
                onClick={() => void submitOTP(otpInput)}
                disabled={otpInput.length !== OTP_LENGTH}
              >
                {translate('auto.components.lanShare.send.confirmOtp', 'Confirm OTP')}
              </Button>
            </div>
          ) : null}

          {readyToTransfer ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="lan-share-pty">
                {translate('auto.components.lanShare.send.ptyLabel', 'PTY ID to transfer')}
              </Label>
              <Input
                id="lan-share-pty"
                value={ptyId}
                onChange={(event) => setPtyId(event.target.value)}
                placeholder={translate(
                  'auto.components.lanShare.send.ptyPlaceholder',
                  'Paste the PTY ID'
                )}
              />
              <Button onClick={() => void transferPty(ptyId)} disabled={!ptyId}>
                {translate('auto.components.lanShare.send.transfer', 'Transfer PTY')}
              </Button>
            </div>
          ) : null}

          {state === 'transferring' ? <LanShareProgress progress={progress} /> : null}

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error.message}
            </div>
          ) : null}

          {state === 'completed' ? (
            <div className="rounded-md border p-3 text-xs">
              {translate(
                'auto.components.lanShare.send.completed',
                'Transfer completed successfully.'
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {awaitingOTP ? (
            <Button variant="outline" onClick={() => void close()}>
              {translate('auto.components.lanShare.cancel', 'Cancel')}
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            {translate('auto.components.lanShare.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
