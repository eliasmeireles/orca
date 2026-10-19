import { useCallback, useEffect, useState } from 'react'
import type {
  AgentTransferProgress,
  AgentTransferSendRequest
} from '../../../../shared/rpc-contract/agent-transfer-params'

type SendStatus = 'idle' | 'sending' | 'done' | 'failed'

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  // Why: Electron prefixes rejected invoke errors with the channel name, which means nothing to users.
  return message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}

/** Drives one chat send and mirrors main's progress events. */
export function useAgentTransferSend() {
  const [status, setStatus] = useState<SendStatus>('idle')
  const [progress, setProgress] = useState<AgentTransferProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => window.api.agentTransfer.onProgress(setProgress), [])

  const send = useCallback(async (request: AgentTransferSendRequest) => {
    setStatus('sending')
    setProgress(null)
    setError(null)
    try {
      await window.api.agentTransfer.sendSession(request)
      setStatus('done')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('failed')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(null)
    setError(null)
  }, [])

  return { status, progress, error, send, reset }
}
