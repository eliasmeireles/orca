import { describe, expect, it } from 'vitest'
import { parseLanShareAddress } from './lan-share-address'

describe('parseLanShareAddress', () => {
  it('builds a receiver config from IP:PORT', () => {
    expect(parseLanShareAddress(' 192.168.1.96:61569 ', 42)).toEqual({
      deviceId: '',
      deviceName: '',
      role: 'receiver',
      listenPort: 61569,
      ips: ['192.168.1.96'],
      createdAt: 42
    })
  })

  it.each([
    '',
    '192.168.1.96',
    '192.168.1.96:',
    ':8080',
    '192.168.1.96:0',
    '10.0.0.1:65536',
    'a b:80'
  ])('rejects %j', (text) => {
    expect(parseLanShareAddress(text)).toBeNull()
  })
})
