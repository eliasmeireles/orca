import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentTransferCommitParams } from '../../shared/rpc-contract/agent-transfer-params'
import { commitAgentTransfer } from './agent-transfer-receive'
import { stageAgentTransferChunk } from './agent-transfer-staging'

const TRANSFER_ID = '6f1c2f0e-6a3b-4c58-9d2e-3b1a7c9e0f11'
const SESSION_ID = 'a1b2c3d4-e5f6-4711-8899-aabbccddeeff'
const SOURCE_CWD = '/Users/alice/proj'
const TARGET_CWD = '/home/alice/proj'

let root: string
let previousHome: string | undefined
let previousUserData: string | undefined

function claudeLine(cwd: string, text: string): string {
  return JSON.stringify({ type: 'user', cwd, sessionId: SESSION_ID, message: text })
}

function commitParams(
  overrides: Partial<AgentTransferCommitParams> = {}
): AgentTransferCommitParams {
  return {
    transferId: TRANSFER_ID,
    worktree: 'id:repo::/home/alice/proj',
    agent: 'claude',
    providerSessionId: SESSION_ID,
    fileName: `${SESSION_ID}.jsonl`,
    sourceCwd: SOURCE_CWD,
    title: 'Fix login',
    senderName: 'mac',
    ...overrides
  }
}

async function stage(content: string): Promise<void> {
  await stageAgentTransferChunk(TRANSFER_ID, Buffer.from(content).toString('base64'), false)
}

function ports() {
  return {
    resolveWorktree: vi.fn(async () => ({ id: 'repo::/home/alice/proj', path: TARGET_CWD })),
    notifyReceived: vi.fn()
  }
}

const claudeDestination = (): string =>
  join(root, 'home', '.claude', 'projects', '-home-alice-proj', `${SESSION_ID}.jsonl`)

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'agent-transfer-'))
  previousHome = process.env.HOME
  previousUserData = process.env.ORCA_USER_DATA_PATH
  process.env.HOME = join(root, 'home')
  process.env.ORCA_USER_DATA_PATH = join(root, 'user-data')
})

afterEach(async () => {
  process.env.HOME = previousHome
  process.env.ORCA_USER_DATA_PATH = previousUserData
  await rm(root, { recursive: true, force: true })
})

describe('commitAgentTransfer', () => {
  it('installs a Claude transcript under the target folder with its cwd re-pointed', async () => {
    await stage(`${claudeLine(SOURCE_CWD, 'hi')}\n`)
    const receivePorts = ports()

    const result = await commitAgentTransfer(commitParams(), receivePorts)

    expect(result).toEqual({ worktreeId: 'repo::/home/alice/proj' })
    expect(await readFile(claudeDestination(), 'utf8')).toBe(`${claudeLine(TARGET_CWD, 'hi')}\n`)
    expect(receivePorts.notifyReceived).toHaveBeenCalledWith({
      agent: 'claude',
      providerSessionId: SESSION_ID,
      worktreeId: 'repo::/home/alice/proj',
      worktreePath: TARGET_CWD,
      title: 'Fix login',
      senderName: 'mac'
    })
  })

  it('replaces an older copy when the chat only grew since the last send', async () => {
    await stage(`${claudeLine(SOURCE_CWD, 'one')}\n`)
    await commitAgentTransfer(commitParams(), ports())
    const grown = `${claudeLine(SOURCE_CWD, 'one')}\n${claudeLine(SOURCE_CWD, 'two')}\n`
    await stage(grown)

    await commitAgentTransfer(commitParams(), ports())

    expect(await readFile(claudeDestination(), 'utf8')).toBe(
      `${claudeLine(TARGET_CWD, 'one')}\n${claudeLine(TARGET_CWD, 'two')}\n`
    )
  })

  it('refuses to overwrite a copy that was continued on this PC', async () => {
    await stage(`${claudeLine(SOURCE_CWD, 'one')}\n`)
    await commitAgentTransfer(commitParams(), ports())
    await stage(`${claudeLine(SOURCE_CWD, 'different')}\n`)
    const receivePorts = ports()

    await expect(commitAgentTransfer(commitParams(), receivePorts)).rejects.toThrow(
      'this chat was continued on this PC'
    )
    expect(receivePorts.notifyReceived).not.toHaveBeenCalled()
  })

  it('places a Codex rollout under the managed home dated by its file name', async () => {
    const fileName = `rollout-2026-10-18T22-46-06-${SESSION_ID}.jsonl`
    await stage(`${JSON.stringify({ type: 'session_meta', payload: { cwd: SOURCE_CWD } })}\n`)

    await commitAgentTransfer(commitParams({ agent: 'codex', fileName }), ports())

    const destination = join(
      root,
      'user-data',
      'codex-runtime-home',
      'home',
      'sessions',
      '2026',
      '10',
      '18',
      fileName
    )
    expect(await readFile(destination, 'utf8')).toContain(`"cwd":"${TARGET_CWD}"`)
  })

  it('rejects a file name that does not belong to the session', async () => {
    await stage(`${claudeLine(SOURCE_CWD, 'hi')}\n`)

    await expect(
      commitAgentTransfer(commitParams({ fileName: 'other-session.jsonl' }), ports())
    ).rejects.toThrow('transcript file name does not belong to this session')
  })

  it('always discards the staged copy', async () => {
    await stage(`${claudeLine(SOURCE_CWD, 'hi')}\n`)
    await commitAgentTransfer(commitParams({ fileName: '../escape.jsonl' }), ports()).catch(
      () => {}
    )

    expect(await readdir(join(root, 'user-data', 'agent-transfer-staging'))).toEqual([])
  })
})
