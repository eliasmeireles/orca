import { randomUUID } from 'node:crypto'
import { WebSocket } from 'ws'
import { getLocalPtyProvider } from '../ipc/pty/provider/registry'
import { LanShareServer } from './lan-share-server'
import { findFreePort, listLocalIPv4Addresses, sendLanMessage } from './lan-share-network'
import type { LanShareConfig, LanShareState, LanShareRole } from '../../shared/lan-share-protocol'
import { generateOTP } from '../../shared/lan-share-protocol'
import type { LanShareManagerEvents } from './lan-share-manager-events'

type LanShareWs = WebSocket & { readyState: number; send: (d: string) => void; close: () => void }

export class LanShareManager {
  private state: LanShareState = 'idle'
  private role: LanShareRole | null = null
  private deviceId: string
  private deviceName: string
  private server?: LanShareServer
  private listenPort = 0
  private otp: string | null = null
  private otpExpiresAt = 0
  private receiverConfig: LanShareConfig | null = null
  private senderWs: LanShareWs | null = null
  private pendingPtyId = ''
  private readonly events: LanShareManagerEvents

  constructor(events: LanShareManagerEvents) {
    this.events = events
    this.deviceId = `orca-${randomUUID().replace(/-/g, '').slice(0, 12)}`
    this.deviceName =
      typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'Orca Device'
  }

  getState(): LanShareState {
    return this.state
  }

  getRole(): LanShareRole | null {
    return this.role
  }

  getDeviceId(): string {
    return this.deviceId
  }

  getDeviceName(): string {
    return this.deviceName
  }

  getLocalIPs(): string[] {
    return listLocalIPv4Addresses()
  }

  async startReceiver(port = 0): Promise<LanShareConfig> {
    // Why: reopening the receive modal must reattach to the running server, not fail.
    if (this.role === 'receiver' && this.receiverConfig) {
      this.events.onStateChange(this.state)
      this.events.onConfigReady(this.receiverConfig)
      this.events.onOTPChallenge(this.otp ?? '', this.otpExpiresAt)
      return this.receiverConfig
    }
    if (this.state !== 'idle') {
      throw new Error('receiver already running')
    }
    this.role = 'receiver'
    this.state = 'receiver_waiting'
    this.events.onStateChange(this.state)
    this.listenPort = await findFreePort(port)
    const ips = this.getLocalIPs()
    this.otp = generateOTP()
    this.otpExpiresAt = Date.now() + 300_000
    const config: LanShareConfig = {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      role: 'receiver',
      listenPort: this.listenPort,
      ips,
      otp: this.otp,
      otpExpiresAt: this.otpExpiresAt,
      createdAt: Date.now()
    }
    this.server = new LanShareServer({
      port: this.listenPort,
      onConnection: (ws) => this.handleSenderConnection(ws),
      onClose: () => {
        if (this.state !== 'closed') {
          this.state = 'idle'
          this.role = null
          this.events.onStateChange(this.state)
        }
      },
      onError: (err) => this.events.onError('server_error', err.message)
    })
    this.server.start()
    this.receiverConfig = config
    this.events.onConfigReady(config)
    this.events.onOTPChallenge(this.otp ?? '', this.otpExpiresAt)
    return config
  }

  stopReceiver(): void {
    this.server?.stop()
    this.server = undefined
    this.state = 'idle'
    this.role = null
    this.otp = null
    this.otpExpiresAt = 0
    this.receiverConfig = null
    this.senderWs = null
    this.events.onStateChange(this.state)
  }

  private handleSenderConnection(ws: LanShareWs): void {
    if (this.role !== 'receiver') {
      sendLanMessage(ws, 'error', { code: 'not_receiver', message: 'not a receiver' })
      ws.close()
      return
    }
    this.senderWs = ws
    this.state = 'receiver_connected'
    this.events.onStateChange(this.state)
    ws.on('message', (raw: Buffer) => {
      try {
        this.handleSenderMessage(JSON.parse(raw.toString('utf-8')))
      } catch {
        sendLanMessage(ws, 'error', { code: 'invalid_message', message: 'bad message' })
      }
    })
    ws.on('close', () => {
      this.senderWs = null
      if (
        this.state === 'receiver_connected' ||
        this.state === 'receiver_otp_challenge' ||
        this.state === 'transferring'
      ) {
        this.state = 'receiver_waiting'
        this.events.onStateChange(this.state)
      }
    })
    sendLanMessage(ws, 'hello', {
      role: 'receiver',
      deviceId: this.deviceId,
      deviceName: this.deviceName
    })
    this.state = 'receiver_otp_challenge'
    this.events.onStateChange(this.state)
    this.events.onOTPChallenge(this.otp ?? '', this.otpExpiresAt)
    sendLanMessage(ws, 'otp_challenge', { otp: this.otp ?? '', expiresAt: this.otpExpiresAt })
  }

  private async handleSenderMessage(msg: unknown): Promise<void> {
    const m = msg as { type: string; payload: unknown }
    switch (m.type) {
      case 'hello': {
        const p = m.payload as { deviceId: string; deviceName: string }
        this.events.onPeerConnected(p.deviceId, p.deviceName)
        break
      }
      case 'otp_submit': {
        const p = m.payload as { otp: string }
        if (p.otp === this.otp && Date.now() < this.otpExpiresAt) {
          this.state = 'receiver_connected'
          this.events.onStateChange(this.state)
          this.events.onOTPResult(true)
          sendLanMessage(this.senderWs, 'otp_accepted', {})
        } else {
          this.events.onOTPResult(false)
        }
        break
      }
      case 'transfer_data': {
        const p = m.payload as { state: string }
        try {
          await getLocalPtyProvider().revive(p.state)
          this.state = 'transferring'
          this.events.onStateChange(this.state)
          this.events.onTransferProgress(1, 1, 100)
          sendLanMessage(this.senderWs, 'transfer_complete', {
            processId: this.pendingPtyId,
            success: true
          })
          this.events.onTransferComplete(true)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          this.events.onTransferComplete(false, msg)
          sendLanMessage(this.senderWs, 'transfer_complete', {
            processId: this.pendingPtyId,
            success: false,
            error: msg
          })
        }
        break
      }
    }
  }

  connectSender(config: LanShareConfig): void {
    if (this.state !== 'idle') {
      throw new Error('already in a session')
    }
    this.role = 'sender'
    this.state = 'sender_connecting'
    this.events.onStateChange(this.state)
    const ws = new WebSocket(
      `ws://${config.ips[0] ?? '127.0.0.1'}:${config.listenPort}`
    ) as unknown as LanShareWs
    this.senderWs = ws
    ws.on('open', () =>
      sendLanMessage(ws, 'hello', {
        role: 'sender',
        deviceId: this.deviceId,
        deviceName: this.deviceName
      })
    )
    ws.on('message', (raw: Buffer) => {
      try {
        this.handleReceiverMessage(JSON.parse(raw.toString('utf-8')))
      } catch {
        // ignore
      }
    })
    ws.on('close', () => {
      this.senderWs = null
      if (this.state !== 'completed' && this.state !== 'closed') {
        this.state = 'idle'
        this.role = null
        this.events.onStateChange(this.state)
      }
    })
    ws.on('error', (err: Error) => this.events.onError('connection_error', err.message))
  }

  submitOTP(otp: string): void {
    if (this.role !== 'sender' || !this.senderWs) {
      throw new Error('not connected as sender')
    }
    this.state = 'sender_otp_pending'
    this.events.onStateChange(this.state)
    sendLanMessage(this.senderWs, 'otp_submit', { otp })
  }

  async transferPty(ptyId: string): Promise<void> {
    if (this.role !== 'sender' || !this.senderWs) {
      throw new Error('not connected as sender')
    }
    this.pendingPtyId = ptyId
    this.state = 'transferring'
    this.events.onStateChange(this.state)
    const state = await getLocalPtyProvider().serialize([ptyId])
    const totalBytes = new TextEncoder().encode(state).length
    sendLanMessage(this.senderWs, 'transfer_start', { processId: ptyId, ptyId, totalBytes })
    const chunkSize = Math.ceil(totalBytes / 10)
    let sent = 0
    while (sent < totalBytes) {
      sent = Math.min(totalBytes, sent + chunkSize)
      this.events.onTransferProgress(sent, totalBytes, Math.round((sent / totalBytes) * 100))
      await new Promise((r) => setTimeout(r, 100))
    }
    sendLanMessage(this.senderWs, 'transfer_data', { processId: ptyId, ptyId, state })
  }

  private handleReceiverMessage(msg: unknown): void {
    const m = msg as { type: string; payload: unknown }
    switch (m.type) {
      case 'hello':
        this.state = 'sender_otp_pending'
        this.events.onStateChange(this.state)
        break
      case 'otp_challenge': {
        const p = m.payload as { otp: string; expiresAt: number }
        this.otp = p.otp
        this.otpExpiresAt = p.expiresAt
        this.events.onOTPChallenge(this.otp, this.otpExpiresAt)
        break
      }
      case 'otp_accepted':
        this.state = 'sender_connecting'
        this.events.onStateChange(this.state)
        this.events.onOTPResult(true)
        break
      case 'otp_rejected':
        this.events.onOTPResult(false)
        break
      case 'transfer_progress': {
        const p = m.payload as { b: number; t: number; p: number }
        this.events.onTransferProgress(p.b, p.t, p.p)
        break
      }
      case 'transfer_complete': {
        const p = m.payload as { ok: boolean; err?: string }
        this.state = 'completed'
        this.events.onStateChange(this.state)
        this.events.onTransferComplete(p.ok, p.err)
        break
      }
      case 'error': {
        const p = m.payload as { code: string; msg: string }
        this.events.onError(p.code, p.msg)
        break
      }
    }
  }

  close(): void {
    this.senderWs?.close()
    this.server?.stop()
    this.server = undefined
    this.senderWs = null
    this.state = 'idle'
    this.role = null
    this.otp = null
    this.otpExpiresAt = 0
    this.pendingPtyId = ''
    this.events.onStateChange(this.state)
  }
}
