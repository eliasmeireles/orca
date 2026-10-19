import { appendFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getOrcaUserDataPath } from '../codex/codex-home-paths'
import { MAX_AGENT_TRANSFER_TRANSCRIPT_BYTES } from '../../shared/rpc-contract/agent-transfer-params'

function stagingDir(): string {
  return join(getOrcaUserDataPath(), 'agent-transfer-staging')
}

/** transferId is a validated UUID, so it is safe as a file name. */
function stagedPath(transferId: string): string {
  return join(stagingDir(), `${transferId}.jsonl`)
}

async function stagedSize(path: string): Promise<number> {
  try {
    return (await stat(path)).size
  } catch {
    return 0
  }
}

/**
 * Writes (or appends) one received chunk of a transcript into the staging area.
 * Refuses once the staged file would exceed the transcript size cap.
 */
export async function stageAgentTransferChunk(
  transferId: string,
  contentBase64: string,
  append: boolean
): Promise<{ stagedBytes: number }> {
  const chunk = Buffer.from(contentBase64, 'base64')
  const path = stagedPath(transferId)
  const previous = append ? await stagedSize(path) : 0
  if (previous + chunk.byteLength > MAX_AGENT_TRANSFER_TRANSCRIPT_BYTES) {
    await discardAgentTransfer(transferId)
    throw new Error('transcript is too large to transfer')
  }
  await mkdir(stagingDir(), { recursive: true })
  await (append ? appendFile(path, chunk) : writeFile(path, chunk))
  return { stagedBytes: previous + chunk.byteLength }
}

export async function readStagedAgentTransfer(transferId: string): Promise<string> {
  try {
    return await readFile(stagedPath(transferId), 'utf8')
  } catch {
    throw new Error('no staged transcript for this transfer')
  }
}

export async function discardAgentTransfer(transferId: string): Promise<void> {
  await rm(stagedPath(transferId), { force: true })
}
