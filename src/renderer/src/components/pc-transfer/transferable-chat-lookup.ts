import type { AiVaultSession } from '../../../../shared/ai-vault-types'
import {
  AGENT_TRANSFER_AGENTS,
  type AgentTransferAgent
} from '../../../../shared/rpc-contract/agent-transfer-params'
import { LOCAL_EXECUTION_HOST_ID } from '../../../../shared/execution-host'
import { createBrowserUuid } from '@/lib/browser-uuid'

export function isTransferableAgent(agent: string): agent is AgentTransferAgent {
  return AGENT_TRANSFER_AGENTS.some((candidate) => candidate === agent)
}

/** This PC's Claude/Codex chats recorded in a workspace folder, newest first. */
export async function listTransferableChats(workspacePath: string): Promise<AiVaultSession[]> {
  const result = await window.api.aiVault.listSessions({
    scopePaths: [workspacePath],
    executionHostScope: LOCAL_EXECUTION_HOST_ID,
    unlimited: true,
    force: true,
    requestToken: createBrowserUuid()
  })
  return result.sessions
    .filter((session) => session.cwd === workspacePath && !session.subagent)
    .filter((session) => isTransferableAgent(session.agent))
    .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt))
}

/** Finds one chat after a transfer landed; forces a rescan so the new file is seen. */
export async function findReceivedChat(
  workspacePath: string,
  agent: AgentTransferAgent,
  providerSessionId: string
): Promise<AiVaultSession | null> {
  const chats = await listTransferableChats(workspacePath)
  return chats.find((chat) => chat.agent === agent && chat.sessionId === providerSessionId) ?? null
}
