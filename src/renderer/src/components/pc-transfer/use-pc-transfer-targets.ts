import { useCallback, useEffect, useState } from 'react'
import type { AiVaultSession } from '../../../../shared/ai-vault-types'
import type { PublicKnownRuntimeEnvironment } from '../../../../shared/runtime-environments'
import type { Worktree } from '../../../../shared/worktree/types'
import { listTransferableChats } from './transferable-chat-lookup'

function readWorktrees(result: unknown): Worktree[] {
  if (typeof result === 'object' && result !== null && 'worktrees' in result) {
    return Array.isArray(result.worktrees) ? result.worktrees : []
  }
  return []
}

/** Paired PCs this one can send to; reload after pairing a new one. */
export function usePairedPcs(open: boolean) {
  const [pcs, setPcs] = useState<PublicKnownRuntimeEnvironment[]>([])
  const reload = useCallback(async () => {
    setPcs(await window.api.runtimeEnvironments.list())
  }, [])
  useEffect(() => {
    if (open) {
      void reload()
    }
  }, [open, reload])
  return { pcs, reload }
}

/** Workspaces on the chosen paired PC, read over its runtime connection. */
export function useRemoteWorkspaces(environmentId: string | null) {
  const [workspaces, setWorkspaces] = useState<Worktree[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setWorkspaces([])
    setError(null)
    if (!environmentId) {
      return
    }
    let cancelled = false
    void window.api.runtimeEnvironments
      .call({ selector: environmentId, method: 'worktree.list', params: {} })
      .then((response) => {
        if (cancelled) {
          return
        }
        if (response.ok) {
          setWorkspaces(readWorktrees(response.result))
        } else {
          setError(response.error.message || response.error.code)
        }
      })
      .catch((err: unknown) => !cancelled && setError(String(err)))
    return () => {
      cancelled = true
    }
  }, [environmentId])
  return { workspaces, error }
}

/** This workspace's Claude/Codex chats that can be sent. */
export function useTransferableChats(open: boolean, workspacePath: string) {
  const [chats, setChats] = useState<AiVaultSession[] | null>(null)
  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    setChats(null)
    void listTransferableChats(workspacePath)
      .then((found) => !cancelled && setChats(found))
      .catch(() => !cancelled && setChats([]))
    return () => {
      cancelled = true
    }
  }, [open, workspacePath])
  return chats
}
