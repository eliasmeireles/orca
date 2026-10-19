import { useCallback, useState, useEffect, useRef } from 'react'
import type { LanShareConfig } from '../../../../shared/lan-share-protocol'

type LanShareApi = {
  getState: () => Promise<string>
  getRole: () => Promise<'sender' | 'receiver' | null>
  getDeviceId: () => Promise<string>
  getDeviceName: () => Promise<string>
  getLocalIPs: () => Promise<string[]>
  startReceiver: (args?: { port?: number }) => Promise<LanShareConfig>
  stopReceiver: () => Promise<{ ok: boolean }>
  connectSender: (args: { config: LanShareConfig }) => Promise<{ ok: boolean }>
  submitOTP: (args: { otp: string }) => Promise<{ ok: boolean }>
  transferPty: (args: { ptyId: string }) => Promise<{ ok: boolean }>
  close: () => Promise<{ ok: boolean }>
  onStateChanged: (cb: (d: { state: string }) => void) => () => void
  onConfigReady: (cb: (d: { config: LanShareConfig }) => void) => () => void
  onPeerConnected: (cb: (d: { deviceId: string; deviceName: string }) => void) => () => void
  onOTPChallenge: (cb: (d: { otp: string; expiresAt: number }) => void) => () => void
  onOTPResult: (cb: (d: { accepted: boolean }) => void) => () => void
  onTransferProgress: (
    cb: (d: { transferredBytes: number; totalBytes: number; percentage: number }) => void
  ) => () => void
  onTransferComplete: (cb: (d: { success: boolean; error?: string }) => void) => () => void
  onError: (cb: (d: { code: string; message: string }) => void) => () => void
}

export function useLanShare() {
  const [state, setState] = useState<string>('idle')
  const [config, setConfig] = useState<LanShareConfig | null>(null)
  const [otp, setOtp] = useState<string | null>(null)
  const [peer, setPeer] = useState<{ deviceId: string; deviceName: string } | null>(null)
  const [progress, setProgress] = useState<{
    transferredBytes: number
    totalBytes: number
    percentage: number
  } | null>(null)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [otpAccepted, setOtpAccepted] = useState(false)

  const api: LanShareApi | undefined = window.api?.lanShare

  const cleanupRefs = useRef<(() => void)[]>([])

  useEffect(() => {
    if (!api) {
      return
    }

    const unsubs: (() => void)[] = []
    unsubs.push(api.onStateChanged(({ state: s }) => setState(s)))
    unsubs.push(api.onConfigReady(({ config: c }) => setConfig(c)))
    unsubs.push(api.onOTPChallenge(({ otp: o }) => setOtp(o)))
    unsubs.push(api.onPeerConnected((p) => setPeer(p)))
    unsubs.push(api.onOTPResult(({ accepted }) => setOtpAccepted(accepted)))
    unsubs.push(api.onTransferProgress((p) => setProgress(p)))
    unsubs.push(
      api.onTransferComplete(({ error: err }) => {
        setError(err ? { code: 'transfer_failed', message: err } : null)
      })
    )
    unsubs.push(api.onError((e) => setError(e)))

    cleanupRefs.current = unsubs
    return () => {
      for (const unsubscribe of unsubs) {
        unsubscribe()
      }
    }
  }, [api])

  const getState = useCallback(async () => {
    if (!api) {
      return
    }
    setState(await api.getState())
  }, [api])

  const getRole = useCallback(async () => {
    if (!api) {
      return null
    }
    return api.getRole()
  }, [api])

  const getLocalIPs = useCallback(async (): Promise<string[]> => {
    if (!api) {
      return []
    }
    return api.getLocalIPs()
  }, [api])

  const startReceiver = useCallback(
    async (port?: number) => {
      if (!api) {
        return null
      }
      setError(null)
      const c = await api.startReceiver({ port })
      setConfig(c)
      return c
    },
    [api]
  )

  const stopReceiver = useCallback(async (): Promise<boolean> => {
    if (!api) {
      return false
    }
    await api.stopReceiver()
    setConfig(null)
    setOtp(null)
    setPeer(null)
    setOtpAccepted(false)
    return true
  }, [api])

  const connectSender = useCallback(
    async (config: LanShareConfig): Promise<boolean> => {
      if (!api) {
        return false
      }
      setError(null)
      await api.connectSender({ config })
      return true
    },
    [api]
  )

  const submitOTP = useCallback(
    async (otpValue: string): Promise<boolean> => {
      if (!api) {
        return false
      }
      setError(null)
      await api.submitOTP({ otp: otpValue })
      return true
    },
    [api]
  )

  const transferPty = useCallback(
    async (ptyId: string): Promise<boolean> => {
      if (!api) {
        return false
      }
      setError(null)
      await api.transferPty({ ptyId })
      return true
    },
    [api]
  )

  const close = useCallback(async (): Promise<boolean> => {
    if (!api) {
      return false
    }
    await api.close()
    setConfig(null)
    setOtp(null)
    setPeer(null)
    setOtpAccepted(false)
    setProgress(null)
    return true
  }, [api])

  return {
    state,
    config,
    otp,
    peer,
    progress,
    error,
    otpAccepted,
    getState,
    getRole,
    getLocalIPs,
    startReceiver,
    stopReceiver,
    connectSender,
    submitOTP,
    transferPty,
    close
  }
}
