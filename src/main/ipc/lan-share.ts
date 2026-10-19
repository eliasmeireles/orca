import { ipcMain, type WebContents } from 'electron'
import type { LanShareConfig, LanShareState } from '../../shared/lan-share-protocol'
import { CHANNEL_PREFIX } from '../../shared/lan-share-protocol'
import { LanShareManager } from '../lan-share/lan-share-manager'

const managerByWebContents = new WeakMap<WebContents, LanShareManager>()

function getOrCreateManager(webContents: WebContents): LanShareManager {
  let manager = managerByWebContents.get(webContents)
  if (!manager) {
    manager = new LanShareManager({
      onStateChange: (state) => {
        webContents.send(`${CHANNEL_PREFIX}state-changed`, { state })
      },
      onConfigReady: (config) => {
        webContents.send(`${CHANNEL_PREFIX}config-ready`, { config })
      },
      onPeerConnected: (deviceId, deviceName) => {
        webContents.send(`${CHANNEL_PREFIX}peer-connected`, { deviceId, deviceName })
      },
      onOTPChallenge: (otp, expiresAt) => {
        webContents.send(`${CHANNEL_PREFIX}otp-challenge`, { otp, expiresAt })
      },
      onOTPResult: (accepted) => {
        webContents.send(`${CHANNEL_PREFIX}otp-result`, { accepted })
      },
      onTransferProgress: (transferredBytes, totalBytes, percentage) => {
        webContents.send(`${CHANNEL_PREFIX}transfer-progress`, {
          transferredBytes,
          totalBytes,
          percentage
        })
      },
      onTransferComplete: (success, error) => {
        webContents.send(`${CHANNEL_PREFIX}transfer-complete`, { success, error })
      },
      onError: (code, message) => {
        webContents.send(`${CHANNEL_PREFIX}error`, { code, message })
      }
    })
    managerByWebContents.set(webContents, manager)
  }
  return manager
}

export function registerLanShareHandlers(webContents: WebContents): void {
  const manager = getOrCreateManager(webContents)

  ipcMain.handle(`${CHANNEL_PREFIX}getState`, () => {
    return manager.getState()
  })

  ipcMain.handle(`${CHANNEL_PREFIX}getRole`, () => {
    return manager.getRole()
  })

  ipcMain.handle(`${CHANNEL_PREFIX}getDeviceId`, () => {
    return manager.getDeviceId()
  })

  ipcMain.handle(`${CHANNEL_PREFIX}getDeviceName`, () => {
    return manager.getDeviceName()
  })

  ipcMain.handle(`${CHANNEL_PREFIX}getLocalIPs`, () => {
    return manager.getLocalIPs()
  })

  ipcMain.handle(`${CHANNEL_PREFIX}startReceiver`, async (_event, port?: number) => {
    const config = await manager.startReceiver(port)
    return config
  })

  ipcMain.handle(`${CHANNEL_PREFIX}stopReceiver`, () => {
    manager.stopReceiver()
    return { ok: true }
  })

  ipcMain.handle(`${CHANNEL_PREFIX}connectSender`, (_event, config: LanShareConfig) => {
    manager.connectSender(config)
    return { ok: true }
  })

  ipcMain.handle(`${CHANNEL_PREFIX}submitOTP`, (_event, otp: string) => {
    manager.submitOTP(otp)
    return { ok: true }
  })

  ipcMain.handle(`${CHANNEL_PREFIX}transferPty`, async (_event, ptyId: string) => {
    await manager.transferPty(ptyId)
    return { ok: true }
  })

  ipcMain.handle(`${CHANNEL_PREFIX}close`, () => {
    manager.close()
    return { ok: true }
  })

  // cleanup when renderer is gone
  webContents.on('destroyed', () => {
    manager.close()
    managerByWebContents.delete(webContents)
  })
}

export { CHANNEL_PREFIX }
export type { LanShareConfig, LanShareState }
