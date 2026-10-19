import { app, ipcMain } from 'electron'
import { resolveEnvironment } from '../../shared/runtime-environment-store'
import { sendAgentTranscript } from '../agent-transfer/agent-transfer-send'
import {
  AGENT_TRANSFER_PROGRESS_CHANNEL,
  type AgentTransferSendRequest
} from '../../shared/rpc-contract/agent-transfer-params'
import { callRuntimeEnvironment } from './runtime-environments/runtime-environment-transport-routing'
import { abortWhenRendererGone } from './renderer-lifetime-abort'

const TRANSFER_CALL_TIMEOUT_MS = 60_000

export function registerAgentTransferHandlers(): void {
  ipcMain.removeHandler('agentTransfer:sendSession')
  ipcMain.handle(
    'agentTransfer:sendSession',
    async (event, request: AgentTransferSendRequest): Promise<{ worktreeId: string }> => {
      const userDataPath = app.getPath('userData')
      const environmentId = resolveEnvironment(userDataPath, request.environmentId).id
      // Why: a reload or close must stop the transfer; the paired PC drops its staged copy on abort.
      const lifetime = abortWhenRendererGone(event.sender)
      try {
        return await sendAgentTranscript(request, {
          call: async (method, params) => {
            const response = await callRuntimeEnvironment(
              userDataPath,
              environmentId,
              method,
              params,
              TRANSFER_CALL_TIMEOUT_MS,
              undefined,
              undefined,
              { signal: lifetime.signal }
            )
            if (response.ok !== true) {
              throw new Error(response.error.message || response.error.code)
            }
            return response.result
          },
          onProgress: (progress) => {
            if (!event.sender.isDestroyed()) {
              event.sender.send(AGENT_TRANSFER_PROGRESS_CHANNEL, progress)
            }
          }
        })
      } finally {
        lifetime.dispose()
      }
    }
  )
}
