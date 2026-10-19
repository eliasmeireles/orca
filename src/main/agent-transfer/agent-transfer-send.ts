import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename } from 'node:path'
import { hostname } from 'node:os'
import { resolveSessionFilePath } from '../native-chat/session-file-resolver'
import {
  AGENT_TRANSFER_CHUNK_BYTES,
  MAX_AGENT_TRANSFER_TRANSCRIPT_BYTES,
  type AgentTransferAgent,
  type AgentTransferProgress,
  type AgentTransferSendRequest
} from '../../shared/rpc-contract/agent-transfer-params'

export type AgentTransferSendPorts = {
  /** Calls a method on the paired PC; rejects with the remote error message on failure. */
  call: (method: string, params: unknown) => Promise<unknown>
  onProgress: (progress: AgentTransferProgress) => void
}

async function locateTranscript(agent: AgentTransferAgent, providerSessionId: string) {
  const path = await resolveSessionFilePath(agent, providerSessionId)
  if (!path) {
    throw new Error('the transcript for this chat was not found on this PC')
  }
  const { size } = await stat(path)
  if (size > MAX_AGENT_TRANSFER_TRANSCRIPT_BYTES) {
    throw new Error('this chat transcript is too large to transfer')
  }
  return { path, size }
}

/**
 * Streams a local chat transcript to a paired PC (stage chunks → commit). The transcript is
 * looked up by session id on this host rather than taken from the renderer, so only agent
 * transcripts can ever leave the machine. Any failure aborts the remote staging.
 */
export async function sendAgentTranscript(
  request: AgentTransferSendRequest,
  ports: AgentTransferSendPorts
): Promise<{ worktreeId: string }> {
  const transcript = await locateTranscript(request.agent, request.providerSessionId)
  const transferId = randomUUID()
  let sentBytes = 0
  try {
    ports.onProgress({ transferId, sentBytes, totalBytes: transcript.size })
    const stream = createReadStream(transcript.path, { highWaterMark: AGENT_TRANSFER_CHUNK_BYTES })
    for await (const chunk of stream) {
      if (!Buffer.isBuffer(chunk)) {
        continue
      }
      await ports.call('agentTransfer.stageChunk', {
        transferId,
        contentBase64: chunk.toString('base64'),
        append: sentBytes > 0
      })
      sentBytes += chunk.byteLength
      ports.onProgress({ transferId, sentBytes, totalBytes: transcript.size })
    }
    const result = await ports.call('agentTransfer.commit', {
      transferId,
      worktree: `id:${request.targetWorktreeId}`,
      agent: request.agent,
      providerSessionId: request.providerSessionId,
      fileName: basename(transcript.path),
      sourceCwd: request.sourceCwd,
      title: request.title?.slice(0, 500),
      senderName: hostname().slice(0, 200)
    })
    return { worktreeId: readWorktreeId(result) ?? request.targetWorktreeId }
  } catch (error) {
    await ports.call('agentTransfer.abort', { transferId }).catch(() => {})
    throw error
  }
}

function readWorktreeId(result: unknown): string | null {
  if (typeof result === 'object' && result !== null && 'worktreeId' in result) {
    return typeof result.worktreeId === 'string' ? result.worktreeId : null
  }
  return null
}
