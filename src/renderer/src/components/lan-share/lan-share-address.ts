import type { LanShareConfig } from '../../../../shared/lan-share-protocol'

const ADDRESS_RE = /^([^\s:]+):(\d{1,5})$/
const MAX_PORT = 65_535

/**
 * Parses the receiver's `IP:PORT` into the config `connectSender` dials.
 * Returns null when the text is not a host followed by a valid TCP port.
 */
export function parseLanShareAddress(text: string, now = Date.now()): LanShareConfig | null {
  const match = ADDRESS_RE.exec(text.trim())
  if (!match) {
    return null
  }
  const port = Number(match[2])
  if (port < 1 || port > MAX_PORT) {
    return null
  }
  return {
    deviceId: '',
    deviceName: '',
    role: 'receiver',
    listenPort: port,
    ips: [match[1]],
    createdAt: now
  }
}
