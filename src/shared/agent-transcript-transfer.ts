const CODEX_ROLLOUT_DATE_RE = /^rollout-(\d{4})-(\d{2})-(\d{2})T/
const SAFE_TRANSCRIPT_NAME_RE = /^[A-Za-z0-9._-]+\.jsonl$/
const MAX_TRANSCRIPT_NAME_LENGTH = 255

function trimTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

function rewriteCwdValue(value: string, from: string, to: string): string {
  if (value === from) {
    return to
  }
  const prefix = from === '/' ? '/' : `${from}/`
  return value.startsWith(prefix) ? `${to === '/' ? '' : to}/${value.slice(prefix.length)}` : value
}

/** Returns a rewritten copy of `node`, or the same reference when no `cwd` under it changed. */
function rewriteCwdFields(node: unknown, from: string, to: string): unknown {
  if (Array.isArray(node)) {
    const next = node.map((item) => rewriteCwdFields(item, from, to))
    return next.some((item, index) => item !== node[index]) ? next : node
  }
  if (typeof node !== 'object' || node === null) {
    return node
  }
  let changed = false
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    const rewritten =
      key === 'cwd' && typeof value === 'string'
        ? rewriteCwdValue(value, from, to)
        : rewriteCwdFields(value, from, to)
    changed ||= rewritten !== value
    next[key] = rewritten
  }
  return changed ? next : node
}

function rewriteLine(line: string, from: string, to: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(line)
  } catch {
    return line
  }
  const rewritten = rewriteCwdFields(parsed, from, to)
  return rewritten === parsed ? line : JSON.stringify(rewritten)
}

/**
 * Re-points every `cwd` field in a JSONL agent transcript from the sending PC's folder to the
 * receiving PC's folder, so agents that check the transcript's working directory accept it.
 * Lines without a matching `cwd` (or that are not JSON) are kept byte-for-byte.
 *
 * @example rewriteTranscriptCwd('{"cwd":"/Users/a/p"}\n', '/Users/a/p', '/home/a/p')
 */
export function rewriteTranscriptCwd(jsonl: string, fromCwd: string, toCwd: string): string {
  const from = trimTrailingSlash(fromCwd)
  const to = trimTrailingSlash(toCwd)
  if (from === to) {
    return jsonl
  }
  return jsonl
    .split('\n')
    .map((line) => (line.includes('"cwd"') ? rewriteLine(line, from, to) : line))
    .join('\n')
}

/** `YYYY/MM/DD` folder Codex files a rollout under, read from its name or else from `now`. */
export function codexRolloutRelativeDir(fileName: string, now: Date): string {
  const match = CODEX_ROLLOUT_DATE_RE.exec(fileName)
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`
  }
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}/${month}/${day}`
}

/** Whether a received transcript name is a bare, visible `.jsonl` file name. */
export function isSafeTranscriptFileName(name: string): boolean {
  return (
    name.length <= MAX_TRANSCRIPT_NAME_LENGTH &&
    !name.startsWith('.') &&
    !name.includes('..') &&
    SAFE_TRANSCRIPT_NAME_RE.test(name)
  )
}
