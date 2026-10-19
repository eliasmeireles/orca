import { z } from 'zod'

export const LanShareRoleSchema = z.enum(['sender', 'receiver'])
export type LanShareRole = z.infer<typeof LanShareRoleSchema>

export const CHANNEL_PREFIX = 'lanShare:'

export const LanShareStateSchema = z.enum([
  'idle',
  'receiver_waiting',
  'receiver_connected',
  'receiver_otp_challenge',
  'sender_connecting',
  'sender_otp_pending',
  'transferring',
  'completed',
  'error',
  'closed'
])
export type LanShareState = z.infer<typeof LanShareStateSchema>

export const LanShareConfigSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  role: LanShareRoleSchema,
  listenPort: z.number().optional(),
  ips: z.array(z.string()),
  otp: z.string().optional(),
  otpExpiresAt: z.number().optional(),
  createdAt: z.number()
})
export type LanShareConfig = z.infer<typeof LanShareConfigSchema>

export const LanShareHandshakeSchema = z.object({
  role: LanShareRoleSchema,
  deviceId: z.string(),
  deviceName: z.string(),
  config: z.string().optional()
})
export type LanShareHandshake = z.infer<typeof LanShareHandshakeSchema>

export const LanShareOTPChallengeSchema = z.object({
  otp: z.string(),
  expiresAt: z.number()
})
export type LanShareOTPChallenge = z.infer<typeof LanShareOTPChallengeSchema>

export const LanShareOTPSubmitSchema = z.object({
  otp: z.string()
})
export type LanShareOTPSubmit = z.infer<typeof LanShareOTPSubmitSchema>

export const LanShareTransferStartSchema = z.object({
  processId: z.string(),
  paneKey: z.string().optional(),
  worktreeId: z.string().optional(),
  totalBytes: z.number()
})
export type LanShareTransferStart = z.infer<typeof LanShareTransferStartSchema>

export const LanShareTransferProgressSchema = z.object({
  processId: z.string(),
  transferredBytes: z.number(),
  totalBytes: z.number(),
  percentage: z.number()
})
export type LanShareTransferProgress = z.infer<typeof LanShareTransferProgressSchema>

export const LanShareTransferCompleteSchema = z.object({
  processId: z.string(),
  success: z.boolean(),
  error: z.string().optional()
})
export type LanShareTransferComplete = z.infer<typeof LanShareTransferCompleteSchema>

export const LanShareTransferDataSchema = z.object({
  processId: z.string(),
  ptyId: z.string(),
  state: z.string()
})
export type LanShareTransferData = z.infer<typeof LanShareTransferDataSchema>

export const LanShareErrorSchema = z.object({
  code: z.string(),
  message: z.string()
})
export type LanShareError = z.infer<typeof LanShareErrorSchema>

export const LanShareMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hello'), payload: LanShareHandshakeSchema }),
  z.object({ type: z.literal('otp_challenge'), payload: LanShareOTPChallengeSchema }),
  z.object({ type: z.literal('otp_submit'), payload: LanShareOTPSubmitSchema }),
  z.object({ type: z.literal('otp_accepted'), payload: z.object({}) }),
  z.object({ type: z.literal('otp_rejected'), payload: z.object({}) }),
  z.object({ type: z.literal('transfer_start'), payload: LanShareTransferStartSchema }),
  z.object({ type: z.literal('transfer_data'), payload: LanShareTransferDataSchema }),
  z.object({ type: z.literal('transfer_progress'), payload: LanShareTransferProgressSchema }),
  z.object({ type: z.literal('transfer_complete'), payload: LanShareTransferCompleteSchema }),
  z.object({ type: z.literal('error'), payload: LanShareErrorSchema }),
  z.object({ type: z.literal('close'), payload: z.object({}) })
])
export type LanShareMessage = z.infer<typeof LanShareMessageSchema>

export function generateOTP(length = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

export function encodeConfig(config: LanShareConfig): string {
  return Buffer.from(JSON.stringify(config)).toString('base64url')
}

export function decodeConfig(encoded: string): LanShareConfig {
  const json = Buffer.from(encoded, 'base64url').toString('utf-8')
  return LanShareConfigSchema.parse(JSON.parse(json))
}
