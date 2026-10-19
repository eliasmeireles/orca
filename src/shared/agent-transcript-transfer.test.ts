import { describe, expect, it } from 'vitest'
import {
  codexRolloutRelativeDir,
  isSafeTranscriptFileName,
  rewriteTranscriptCwd
} from './agent-transcript-transfer'

const FROM = '/Users/alice/proj'
const TO = '/home/alice/proj'

describe('rewriteTranscriptCwd', () => {
  it('rewrites a Claude line top-level cwd', () => {
    const line = JSON.stringify({ type: 'user', cwd: FROM, message: 'hi' })
    expect(rewriteTranscriptCwd(line, FROM, TO)).toBe(
      JSON.stringify({ type: 'user', cwd: TO, message: 'hi' })
    )
  })

  it('rewrites Codex session_meta and turn_context payload cwd', () => {
    const input = [
      JSON.stringify({ type: 'session_meta', payload: { id: 'x', cwd: FROM } }),
      JSON.stringify({ type: 'turn_context', payload: { cwd: `${FROM}/src` } })
    ].join('\n')
    expect(rewriteTranscriptCwd(input, FROM, TO)).toBe(
      [
        JSON.stringify({ type: 'session_meta', payload: { id: 'x', cwd: TO } }),
        JSON.stringify({ type: 'turn_context', payload: { cwd: `${TO}/src` } })
      ].join('\n')
    )
  })

  it('rewrites cwd fields nested in arrays', () => {
    const line = JSON.stringify({ items: [{ cwd: `${FROM}/a/b` }] })
    expect(rewriteTranscriptCwd(line, FROM, TO)).toBe(
      JSON.stringify({ items: [{ cwd: `${TO}/a/b` }] })
    )
  })

  it('leaves sibling-prefix folders alone', () => {
    const line = JSON.stringify({ cwd: '/Users/alice/proj-other' })
    expect(rewriteTranscriptCwd(line, FROM, TO)).toBe(line)
  })

  it('leaves non-cwd keys holding the path untouched', () => {
    const line = JSON.stringify({ cwd: FROM, file: `${FROM}/a.ts` })
    expect(rewriteTranscriptCwd(line, FROM, TO)).toBe(
      JSON.stringify({ cwd: TO, file: `${FROM}/a.ts` })
    )
  })

  it('keeps unmatched and invalid lines byte-for-byte', () => {
    const untouched = '{ "cwd" : "/elsewhere" ,"spacing":  1 }'
    const invalid = '{"cwd": not json'
    const input = `${untouched}\n${invalid}`
    expect(rewriteTranscriptCwd(input, FROM, TO)).toBe(input)
  })

  it('preserves blank lines and the trailing newline', () => {
    const input = `${JSON.stringify({ cwd: FROM })}\n\n${JSON.stringify({ cwd: FROM })}\n`
    expect(rewriteTranscriptCwd(input, FROM, TO)).toBe(
      `${JSON.stringify({ cwd: TO })}\n\n${JSON.stringify({ cwd: TO })}\n`
    )
  })

  it('returns the input unchanged when both folders are the same', () => {
    const line = '{ "cwd":"/Users/alice/proj" }'
    expect(rewriteTranscriptCwd(line, FROM, `${FROM}/`)).toBe(line)
  })

  it('treats trailing slashes like their trimmed paths', () => {
    const line = JSON.stringify({ cwd: FROM })
    expect(rewriteTranscriptCwd(line, `${FROM}/`, `${TO}/`)).toBe(JSON.stringify({ cwd: TO }))
  })
})

describe('codexRolloutRelativeDir', () => {
  it('reads the date from a rollout file name', () => {
    expect(
      codexRolloutRelativeDir('rollout-2026-10-18T22-46-06-abc.jsonl', new Date(2000, 0, 1))
    ).toBe('2026/10/18')
  })

  it('falls back to the local date for other names', () => {
    expect(codexRolloutRelativeDir('abc.jsonl', new Date(2026, 2, 5))).toBe('2026/03/05')
  })
})

describe('isSafeTranscriptFileName', () => {
  it.each(['abc.jsonl', 'rollout-2026-10-18T22-46-06-a1b2.jsonl', 'a_b.c.jsonl'])(
    'accepts %j',
    (name) => {
      expect(isSafeTranscriptFileName(name)).toBe(true)
    }
  )

  it.each([
    '../abc.jsonl',
    'dir/abc.jsonl',
    'dir\\abc.jsonl',
    '.hidden.jsonl',
    'abc.json',
    'a..b.jsonl',
    `${'a'.repeat(250)}.jsonl`
  ])('rejects %j', (name) => {
    expect(isSafeTranscriptFileName(name)).toBe(false)
  })
})
