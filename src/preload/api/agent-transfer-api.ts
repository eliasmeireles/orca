import type {
  AgentTransferProgress,
  AgentTransferReceivedEvent,
  AgentTransferSendRequest
} from '../../shared/rpc-contract/agent-transfer-params'

export type AgentTransferApi = {
  /** Streams one local chat transcript to a paired PC's workspace. */
  sendSession: (request: AgentTransferSendRequest) => Promise<{ worktreeId: string }>
  onProgress: (callback: (progress: AgentTransferProgress) => void) => () => void
  /** Fires on the receiving PC once a chat from another PC landed in one of its workspaces. */
  onReceived: (callback: (event: AgentTransferReceivedEvent) => void) => () => void
}
