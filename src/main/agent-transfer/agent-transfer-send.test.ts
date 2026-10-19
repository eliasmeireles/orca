import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AGENT_TRANSFER_CHUNK_BYTES } from '../../shared/rpc-contract/agent-transfer-params'

const resolveSessionFilePath = vi.hoisted(() => vi.fn())
vi.mock('../native-chat/session-file-resolver', () => ({ resolveSessionFilePath }))

const { sendAgentTranscript } = await import('./agent-transfer-send')

const SESSION_ID = 'a1b2c3d4-e5f6-4711-8899-aabbccddeeff'
let root: string

const request = {
  environmentId: 'env-1',
  agent: 'claude' as const,
  providerSessionId: SESSION_ID,
  sourceCwd: '/Users/alice/proj',
  targetWorktreeId: 'repo::/home/alice/proj',
  title: 'Fix login'
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'agent-transfer-send-'))
  resolveSessionFilePath.mockReset()
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

async function transcriptOfBytes(byteLength: number): Promise<string> {
  const path = join(root, `${SESSION_ID}.jsonl`)
  await writeFile(path, Buffer.alloc(byteLength, 'a'))
  resolveSessionFilePath.mockResolvedValue(path)
  return path
}

describe('sendAgentTranscript', () => {
  it('stages every chunk in order, then commits into the target workspace', async () => {
    await transcriptOfBytes(AGENT_TRANSFER_CHUNK_BYTES + 10)
    const call = vi.fn(async (method: string, _params: unknown) =>
      method === 'agentTransfer.commit' ? { worktreeId: 'repo::/home/alice/proj' } : {}
    )
    const onProgress = vi.fn()

    const result = await sendAgentTranscript(request, { call, onProgress })

    expect(result).toEqual({ worktreeId: 'repo::/home/alice/proj' })
    expect(call.mock.calls.map(([method]) => method)).toEqual([
      'agentTransfer.stageChunk',
      'agentTransfer.stageChunk',
      'agentTransfer.commit'
    ])
    expect(call.mock.calls[0][1]).toMatchObject({ append: false })
    expect(call.mock.calls[1][1]).toMatchObject({ append: true })
    expect(call.mock.calls[2][1]).toMatchObject({
      worktree: 'id:repo::/home/alice/proj',
      agent: 'claude',
      providerSessionId: SESSION_ID,
      fileName: `${SESSION_ID}.jsonl`,
      sourceCwd: '/Users/alice/proj',
      title: 'Fix login'
    })
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sentBytes: AGENT_TRANSFER_CHUNK_BYTES + 10,
        totalBytes: AGENT_TRANSFER_CHUNK_BYTES + 10
      })
    )
  })

  it('aborts the remote staging when a call fails', async () => {
    await transcriptOfBytes(10)
    const call = vi.fn(async (method: string, _params: unknown) => {
      if (method === 'agentTransfer.commit') {
        throw new Error('this chat was continued on this PC; refusing to overwrite it')
      }
      return {}
    })

    await expect(sendAgentTranscript(request, { call, onProgress: vi.fn() })).rejects.toThrow(
      'this chat was continued on this PC'
    )
    expect(call).toHaveBeenLastCalledWith(
      'agentTransfer.abort',
      expect.objectContaining({ transferId: expect.any(String) })
    )
  })

  it('refuses when this PC has no transcript for the chat', async () => {
    resolveSessionFilePath.mockResolvedValue(null)
    const call = vi.fn()

    await expect(sendAgentTranscript(request, { call, onProgress: vi.fn() })).rejects.toThrow(
      'the transcript for this chat was not found on this PC'
    )
    expect(call).not.toHaveBeenCalled()
  })
})
