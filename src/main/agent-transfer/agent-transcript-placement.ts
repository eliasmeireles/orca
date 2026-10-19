import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { encodeClaudeProjectPath } from '../ai-vault/claude-project-dir-encoding'
import { getOrcaManagedCodexHomePath } from '../codex/codex-home-paths'
import {
  codexRolloutRelativeDir,
  isSafeTranscriptFileName
} from '../../shared/agent-transcript-transfer'
import type { AgentTransferAgent } from '../../shared/rpc-contract/agent-transfer-params'

type TranscriptPlacementInput = {
  agent: AgentTransferAgent
  providerSessionId: string
  fileName: string
  targetCwd: string
}

/**
 * Where this host's agent looks for the transcript. Both roots are on the adoption candidate
 * lists (`~/.claude` for Claude, Orca's managed CODEX_HOME for Codex), so "Resume in new chat"
 * finds the file without any account switch.
 */
export function agentTranscriptDestination(input: TranscriptPlacementInput): string {
  if (
    !isSafeTranscriptFileName(input.fileName) ||
    !input.fileName.includes(input.providerSessionId)
  ) {
    throw new Error('transcript file name does not belong to this session')
  }
  if (input.agent === 'claude') {
    return join(
      homedir(),
      '.claude',
      'projects',
      encodeClaudeProjectPath(input.targetCwd),
      `${input.providerSessionId}.jsonl`
    )
  }
  return join(
    getOrcaManagedCodexHomePath(),
    'sessions',
    ...codexRolloutRelativeDir(input.fileName, new Date()).split('/'),
    input.fileName
  )
}

async function readExisting(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

/**
 * Writes the transcript atomically. Re-sending a chat that only grew since the last transfer
 * replaces the older copy; a copy that was continued on this PC is never overwritten.
 */
export async function writeAgentTranscript(destination: string, content: string): Promise<void> {
  const existing = await readExisting(destination)
  if (existing !== null && !content.startsWith(existing)) {
    throw new Error('this chat was continued on this PC; refusing to overwrite it')
  }
  await mkdir(dirname(destination), { recursive: true })
  const temp = `${destination}.orca-transfer-${process.pid}.tmp`
  await writeFile(temp, content, 'utf8')
  await rename(temp, destination)
}
