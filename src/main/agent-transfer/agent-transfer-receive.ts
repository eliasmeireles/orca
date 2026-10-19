import { rewriteTranscriptCwd } from '../../shared/agent-transcript-transfer'
import type {
  AgentTransferCommitParams,
  AgentTransferReceivedEvent
} from '../../shared/rpc-contract/agent-transfer-params'
import { agentTranscriptDestination, writeAgentTranscript } from './agent-transcript-placement'
import { discardAgentTransfer, readStagedAgentTransfer } from './agent-transfer-staging'

export type AgentTransferReceivePorts = {
  resolveWorktree: (selector: string) => Promise<{ id: string; path: string }>
  notifyReceived: (event: AgentTransferReceivedEvent) => void
}

/**
 * Installs a staged transcript into the target workspace's agent store, re-pointing its
 * `cwd` from the sender's folder to this PC's folder, then tells this PC's window.
 */
export async function commitAgentTransfer(
  params: AgentTransferCommitParams,
  ports: AgentTransferReceivePorts
): Promise<{ worktreeId: string }> {
  try {
    const worktree = await ports.resolveWorktree(params.worktree)
    const staged = await readStagedAgentTransfer(params.transferId)
    const destination = agentTranscriptDestination({
      agent: params.agent,
      providerSessionId: params.providerSessionId,
      fileName: params.fileName,
      targetCwd: worktree.path
    })
    await writeAgentTranscript(
      destination,
      rewriteTranscriptCwd(staged, params.sourceCwd, worktree.path)
    )
    ports.notifyReceived({
      agent: params.agent,
      providerSessionId: params.providerSessionId,
      worktreeId: worktree.id,
      worktreePath: worktree.path,
      title: params.title ?? null,
      senderName: params.senderName ?? null
    })
    return { worktreeId: worktree.id }
  } finally {
    await discardAgentTransfer(params.transferId)
  }
}
