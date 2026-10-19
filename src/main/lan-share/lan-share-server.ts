import { WebSocketServer, WebSocket } from 'ws'

export type LanShareServerOptions = {
  port: number
  onConnection: (ws: WebSocket, send: (msg: unknown) => void) => void
  onClose: () => void
  onError: (err: Error) => void
}

export class LanShareServer {
  private wss?: WebSocketServer
  private clients = new Set<WebSocket>()
  private readonly options: LanShareServerOptions

  constructor(options: LanShareServerOptions) {
    this.options = options
  }

  start(): void {
    this.wss = new WebSocketServer({ port: this.options.port })

    this.wss.on('connection', (ws) => {
      this.clients.add(ws)

      const send = (msg: unknown): void => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg))
        }
      }

      ws.on('message', (raw: Buffer) => {
        try {
          JSON.parse(raw.toString('utf-8'))
          this.options.onConnection(ws, send)
        } catch {
          // ignore malformed frames
        }
      })

      ws.on('close', () => {
        this.clients.delete(ws)
      })

      ws.on('error', (err) => {
        this.options.onError(err as Error)
      })
    })

    this.wss.on('error', (err) => {
      this.options.onError(err as Error)
    })
  }

  stop(): void {
    for (const ws of this.clients) {
      ws.close()
    }
    this.clients.clear()
    this.wss?.close()
    this.wss = undefined
    this.options.onClose()
  }

  broadcast(msg: unknown): void {
    const payload = JSON.stringify(msg)
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload)
      }
    }
  }

  sendTo(ws: WebSocket, msg: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }

  isListening(): boolean {
    return this.wss !== undefined
  }
}
