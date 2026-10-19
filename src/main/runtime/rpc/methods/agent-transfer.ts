import { defineMethod } from '../core'
import {
  AgentTransferAbort,
  AgentTransferCommit,
  AgentTransferStageChunk
} from '../../../../shared/rpc-contract/agent-transfer-params'
import { commitAgentTransfer } from '../../../agent-transfer/agent-transfer-receive'
import { broadcastAgentTransferReceived } from '../../../agent-transfer/agent-transfer-received-broadcast'
import {
  discardAgentTransfer,
  stageAgentTransferChunk
} from '../../../agent-transfer/agent-transfer-staging'

// Why: a paired PC pushes a chat transcript here in chunks, then commits it into a workspace.
export const AGENT_TRANSFER_METHODS = [
  defineMethod({
    name: 'agentTransfer.stageChunk',
    permission: 'workspace',
    params: AgentTransferStageChunk,
    handler: async (params) =>
      stageAgentTransferChunk(params.transferId, params.contentBase64, params.append)
  }),
  defineMethod({
    name: 'agentTransfer.commit',
    permission: 'workspace',
    params: AgentTransferCommit,
    handler: async (params, { runtime }) =>
      commitAgentTransfer(params, {
        resolveWorktree: (selector) => runtime.showManagedWorktree(selector),
        notifyReceived: broadcastAgentTransferReceived
      })
  }),
  defineMethod({
    name: 'agentTransfer.abort',
    permission: 'workspace',
    params: AgentTransferAbort,
    handler: async (params) => {
      await discardAgentTransfer(params.transferId)
      return { ok: true }
    }
  })
]
