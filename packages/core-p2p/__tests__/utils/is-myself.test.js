'use strict'

const isMyself = require('../../lib/utils/is-myself')
const os = require('os')

describe('isMyself', () => {
  it('should be a function', () => {
    expect(isMyself).toBeFunction()
  })

  it('should be ok for localhost addresses', () => {
    expect(isMyself('127.0.0.1')).toBeTrue()

    expect(isMyself('192.167.22.1')).toBeFalse()
  })

  it('should be ok for LAN addresses', () => {
    const interfaces = os.networkInterfaces()
    let addresses = []

    // getting local addresses
    Object.keys(interfaces).forEach(ifname => {
      interfaces[ifname].some(iface => addresses.push(iface.address))
    })

    addresses.forEach(ipAddress => {
      expect(isMyself(ipAddress)).toBeTrue()
    })
  })
})
