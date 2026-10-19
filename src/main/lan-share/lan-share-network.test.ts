import type { NetworkInterfaceInfo } from 'node:os'
import { describe, expect, it } from 'vitest'
import { listLocalIPv4Addresses } from './lan-share-network'

function ipv4(address: string, internal = false): NetworkInterfaceInfo {
  return {
    address,
    netmask: '255.255.255.0',
    family: 'IPv4',
    mac: '00:00:00:00:00:00',
    internal,
    cidr: `${address}/24`
  }
}

describe('listLocalIPv4Addresses', () => {
  it('keeps LAN addresses and drops loopback and container bridges', () => {
    expect(
      listLocalIPv4Addresses({
        lo: [ipv4('127.0.0.1', true)],
        en0: [ipv4('192.168.1.96')],
        wlp2s0: [ipv4('192.168.1.40')],
        docker0: [ipv4('172.17.0.1')],
        docker_gwbridge: [ipv4('172.18.0.1')],
        'br-3f2a9c1d7e44': [ipv4('172.19.0.1')],
        veth1a2b3c: [ipv4('169.254.10.2')],
        'cni-podman0': [ipv4('10.88.0.1')]
      })
    ).toEqual(['192.168.1.96', '192.168.1.40'])
  })

  it('skips IPv6 entries', () => {
    expect(
      listLocalIPv4Addresses({
        en0: [{ ...ipv4('fe80::1'), family: 'IPv6', scopeid: 0 }]
      })
    ).toEqual([])
  })
})
