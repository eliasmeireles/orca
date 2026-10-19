import { createServer } from 'node:net'
import { networkInterfaces } from 'node:os'

type LanMessageSocket = { send: (data: string) => void }

// Why: container bridges (Docker/Podman) are only reachable from this host, never from a LAN peer.
const CONTAINER_INTERFACE_RE =
  /^(docker\d*|docker_gwbridge|br-[0-9a-f]+|veth.*|cni-podman\d*|podman\d*)$/

/** Non-internal IPv4 addresses a LAN peer can reach this machine on. */
export function listLocalIPv4Addresses(
  interfaces: ReturnType<typeof networkInterfaces> = networkInterfaces()
): string[] {
  const ips: string[] = []
  for (const [name, iface] of Object.entries(interfaces)) {
    if (CONTAINER_INTERFACE_RE.test(name)) {
      continue
    }
    for (const addr of iface ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address)
      }
    }
  }
  return ips
}

/** Returns `preferred` when set, otherwise asks the OS for a free TCP port. */
export function findFreePort(preferred: number): Promise<number> {
  if (preferred > 0) {
    return Promise.resolve(preferred)
  }
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, () => {
      const address = server.address()
      const port = address && typeof address === 'object' ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

/** Sends one `{ type, payload }` frame of the LAN share protocol. */
export function sendLanMessage(ws: LanMessageSocket | null, type: string, payload: unknown): void {
  ws?.send(JSON.stringify({ type, payload }))
}
