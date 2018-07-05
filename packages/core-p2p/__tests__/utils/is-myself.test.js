'use strict'

const isMySelf = require('../../lib/utils/is-myself')
const os = require('os')

describe('isMySelf', () => {
  it('should be a function', () => {
    expect(isMySelf).toBeFunction()
  })

  it('should be ok for localhost addresses', () => {
    expect(isMySelf('127.0.0.1')).toBeTruthy()
    expect(isMySelf('::1')).toBeTruthy()
    expect(isMySelf('192.167.22.1')).toBeFalsy()
  })

  it('should be ok for LAN addresses', () => {
    const interfaces = os.networkInterfaces()
    let addresses = []

    // getting local addresses
    Object.keys(interfaces).some(function (ifname) {
      interfaces[ifname].some(function (iface) {
          addresses.push(iface.address)
        })
    })

    addresses.forEach(ipAddress => {
      expect(isMySelf(ipAddress).toBeTruthy())
    })
  })
})
