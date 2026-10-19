import { ipcRenderer } from 'electron'
import type { LanShareApi } from './lan-share-api'
import type { LanShareConfig, LanShareRole, LanShareState } from '../../shared/lan-share-protocol'
import { CHANNEL_PREFIX } from '../../shared/lan-share-protocol'

const CH = CHANNEL_PREFIX

export const lanShareApi: LanShareApi = {
  getState: (): Promise<LanShareState> => ipcRenderer.invoke(`${CH}getState`),

  getRole: (): Promise<LanShareRole | null> => ipcRenderer.invoke(`${CH}getRole`),

  getDeviceId: (): Promise<string> => ipcRenderer.invoke(`${CH}getDeviceId`),

  getDeviceName: (): Promise<string> => ipcRenderer.invoke(`${CH}getDeviceName`),

  getLocalIPs: (): Promise<string[]> => ipcRenderer.invoke(`${CH}getLocalIPs`),

  startReceiver: (args?: { port?: number }): Promise<LanShareConfig> =>
    ipcRenderer.invoke(`${CH}startReceiver`, args?.port),

  stopReceiver: (): Promise<{ ok: boolean }> => ipcRenderer.invoke(`${CH}stopReceiver`),

  connectSender: (args: { config: LanShareConfig }): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(`${CH}connectSender`, args.config),

  submitOTP: (args: { otp: string }): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(`${CH}submitOTP`, args.otp),

  transferPty: (args: { ptyId: string }): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(`${CH}transferPty`, args.ptyId),

  close: (): Promise<{ ok: boolean }> => ipcRenderer.invoke(`${CH}close`),

  onStateChanged: (callback) => {
    const listener = (_event: unknown, data: { state: LanShareState }) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}state-changed`, listener)
    return () => ipcRenderer.removeListener(`${CH}state-changed`, listener)
  },

  onConfigReady: (callback) => {
    const listener = (_event: unknown, data: { config: LanShareConfig }) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}config-ready`, listener)
    return () => ipcRenderer.removeListener(`${CH}config-ready`, listener)
  },

  onPeerConnected: (callback) => {
    const listener = (_event: unknown, data: { deviceId: string; deviceName: string }) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}peer-connected`, listener)
    return () => ipcRenderer.removeListener(`${CH}peer-connected`, listener)
  },

  onOTPChallenge: (callback) => {
    const listener = (_event: unknown, data: { otp: string; expiresAt: number }) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}otp-challenge`, listener)
    return () => ipcRenderer.removeListener(`${CH}otp-challenge`, listener)
  },

  onOTPResult: (callback) => {
    const listener = (_event: unknown, data: { accepted: boolean }) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}otp-result`, listener)
    return () => ipcRenderer.removeListener(`${CH}otp-result`, listener)
  },

  onTransferProgress: (callback) => {
    const listener = (
      _event: unknown,
      data: { transferredBytes: number; totalBytes: number; percentage: number }
    ) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}transfer-progress`, listener)
    return () => ipcRenderer.removeListener(`${CH}transfer-progress`, listener)
  },

  onTransferComplete: (callback) => {
    const listener = (_event: unknown, data: { success: boolean; error?: string }) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}transfer-complete`, listener)
    return () => ipcRenderer.removeListener(`${CH}transfer-complete`, listener)
  },

  onError: (callback) => {
    const listener = (_event: unknown, data: { code: string; message: string }) => {
      callback(data)
    }
    ipcRenderer.on(`${CH}error`, listener)
    return () => ipcRenderer.removeListener(`${CH}error`, listener)
  }
}
