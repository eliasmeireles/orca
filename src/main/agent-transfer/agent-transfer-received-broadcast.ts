import { BrowserWindow } from 'electron'
import {
  AGENT_TRANSFER_RECEIVED_CHANNEL,
  type AgentTransferReceivedEvent
} from '../../shared/rpc-contract/agent-transfer-params'

/** Tells every open window on this PC that a chat arrived from another PC. */
export function broadcastAgentTransferReceived(event: AgentTransferReceivedEvent): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(AGENT_TRANSFER_RECEIVED_CHANNEL, event)
    }
  }
}
