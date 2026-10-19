import { ipcRenderer } from 'electron'
import type { PreloadApi } from '../api-types'
import {
  AGENT_TRANSFER_PROGRESS_CHANNEL,
  AGENT_TRANSFER_RECEIVED_CHANNEL
} from '../../shared/rpc-contract/agent-transfer-params'

export const agentTransferApi = {
  sendSession: (request) => ipcRenderer.invoke('agentTransfer:sendSession', request),
  onProgress: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      progress: Parameters<typeof callback>[0]
    ) => callback(progress)
    ipcRenderer.on(AGENT_TRANSFER_PROGRESS_CHANNEL, listener)
    return () => ipcRenderer.removeListener(AGENT_TRANSFER_PROGRESS_CHANNEL, listener)
  },
  onReceived: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, event: Parameters<typeof callback>[0]) =>
      callback(event)
    ipcRenderer.on(AGENT_TRANSFER_RECEIVED_CHANNEL, listener)
    return () => ipcRenderer.removeListener(AGENT_TRANSFER_RECEIVED_CHANNEL, listener)
  }
} satisfies PreloadApi['agentTransfer']
