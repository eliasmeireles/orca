import { z } from 'zod'
import { StrictNonEmptyString, WorktreeSelector } from './agent-session-params'

/** Agents whose transcripts another PC can receive and resume. */
export const AGENT_TRANSFER_AGENTS = ['claude', 'codex'] as const
export type AgentTransferAgent = (typeof AGENT_TRANSFER_AGENTS)[number]

/** Raw bytes per chunk; base64 grows it by 4/3 on the wire. */
export const AGENT_TRANSFER_CHUNK_BYTES = 384 * 1024
const MAX_CHUNK_BASE64_LENGTH = Math.ceil(AGENT_TRANSFER_CHUNK_BYTES / 3) * 4
export const MAX_AGENT_TRANSFER_TRANSCRIPT_BYTES = 512 * 1024 * 1024

const TransferId = z.string().uuid()

export const AgentTransferStageChunk = z.object({
  transferId: TransferId,
  contentBase64: z.string().max(MAX_CHUNK_BASE64_LENGTH),
  append: z.boolean()
})

export const AgentTransferCommit = z.object({
  transferId: TransferId,
  worktree: WorktreeSelector,
  agent: z.enum(AGENT_TRANSFER_AGENTS),
  providerSessionId: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
  fileName: StrictNonEmptyString(255, 'Invalid transcript file name'),
  sourceCwd: StrictNonEmptyString(16 * 1024, 'Invalid source folder'),
  title: z.string().max(500).optional(),
  senderName: z.string().max(200).optional()
})
export type AgentTransferCommitParams = z.infer<typeof AgentTransferCommit>

export const AgentTransferAbort = z.object({ transferId: TransferId })

/** What the receiving host tells its own window once a chat landed. */
export type AgentTransferReceivedEvent = {
  agent: AgentTransferAgent
  providerSessionId: string
  worktreeId: string
  worktreePath: string
  title: string | null
  senderName: string | null
}

/** Main → renderer channel the receiving host fires when a chat landed. */
export const AGENT_TRANSFER_RECEIVED_CHANNEL = 'agentTransfer:received'

/** Main → renderer channel for send progress on the sending PC. */
export const AGENT_TRANSFER_PROGRESS_CHANNEL = 'agentTransfer:progress'

export type AgentTransferSendRequest = {
  environmentId: string
  agent: AgentTransferAgent
  providerSessionId: string
  sourceCwd: string
  targetWorktreeId: string
  title?: string
}

export type AgentTransferProgress = { transferId: string; sentBytes: number; totalBytes: number }
