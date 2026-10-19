import type { LanShareConfig, LanShareState } from '../../shared/lan-share-protocol'

/** Callbacks the manager fires so the IPC layer can forward them to the renderer. */
export type LanShareManagerEvents = {
  onStateChange: (state: LanShareState) => void
  onConfigReady: (config: LanShareConfig) => void
  onPeerConnected: (deviceId: string, deviceName: string) => void
  onOTPChallenge: (otp: string, expiresAt: number) => void
  onOTPResult: (accepted: boolean) => void
  onTransferProgress: (b: number, t: number, p: number) => void
  onTransferComplete: (ok: boolean, err?: string) => void
  onError: (code: string, msg: string) => void
}
