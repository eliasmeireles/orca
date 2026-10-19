import { useEffect } from 'react'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { newAgentLaunchRequestId } from '@/lib/agent-launch-request-id'
import { resumeAiVaultSessionInNewChat } from '../right-sidebar/ai-vault-session-resume-in-chat-launch'
import type { AgentTransferReceivedEvent } from '../../../../shared/rpc-contract/agent-transfer-params'
import { findReceivedChat } from './transferable-chat-lookup'

async function openReceivedChat(event: AgentTransferReceivedEvent): Promise<void> {
  const chat = await findReceivedChat(event.worktreePath, event.agent, event.providerSessionId)
  if (!chat) {
    toast.error(
      translate(
        'auto.components.pcTransfer.received.notFound',
        'The received chat is not in Session History yet. Try again in a moment.'
      )
    )
    return
  }
  await resumeAiVaultSessionInNewChat(
    chat,
    event.agent,
    event.worktreeId,
    newAgentLaunchRequestId()
  )
}

/** Renders nothing: announces chats another PC sent here and offers to open them. */
export function AgentTransferReceivedGate(): null {
  useEffect(
    () =>
      window.api.agentTransfer?.onReceived((event) => {
        toast.success(
          translate('auto.components.pcTransfer.received.title', 'Chat received from {{value0}}', {
            value0:
              event.senderName ?? translate('auto.components.pcTransfer.anotherPc', 'another PC')
          }),
          {
            description: event.title ?? undefined,
            duration: Infinity,
            action: {
              label: translate('auto.components.pcTransfer.received.open', 'Open chat'),
              onClick: () => void openReceivedChat(event)
            }
          }
        )
      }),
    []
  )
  return null
}
