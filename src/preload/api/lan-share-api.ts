import type { LanShareConfig, LanShareState, LanShareRole } from '../../shared/lan-share-protocol'

export type LanShareApi = {
  getState: () => Promise<LanShareState>
  getRole: () => Promise<LanShareRole | null>
  getDeviceId: () => Promise<string>
  getDeviceName: () => Promise<string>
  getLocalIPs: () => Promise<string[]>
  startReceiver: (args?: { port?: number }) => Promise<LanShareConfig>
  stopReceiver: () => Promise<{ ok: boolean }>
  connectSender: (args: { config: LanShareConfig }) => Promise<{ ok: boolean }>
  submitOTP: (args: { otp: string }) => Promise<{ ok: boolean }>
  transferPty: (args: { ptyId: string }) => Promise<{ ok: boolean }>
  close: () => Promise<{ ok: boolean }>
  onStateChanged: (callback: (data: { state: LanShareState }) => void) => () => void
  onConfigReady: (callback: (data: { config: LanShareConfig }) => void) => () => void
  onPeerConnected: (
    callback: (data: { deviceId: string; deviceName: string }) => void
  ) => () => void
  onOTPChallenge: (callback: (data: { otp: string; expiresAt: number }) => void) => () => void
  onOTPResult: (callback: (data: { accepted: boolean }) => void) => () => void
  onTransferProgress: (
    callback: (data: { transferredBytes: number; totalBytes: number; percentage: number }) => void
  ) => () => void
  onTransferComplete: (callback: (data: { success: boolean; error?: string }) => void) => () => void
  onError: (callback: (data: { code: string; message: string }) => void) => () => void
}
