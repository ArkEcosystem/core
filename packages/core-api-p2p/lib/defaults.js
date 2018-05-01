'use strict'

module.exports = {
  port: 4002,
  remoteinterface: true,
  dns: [
    // Google
    '8.8.8.8',
    '8.8.4.4',
    // CloudFlare
    '1.1.1.1',
    '1.0.0.1',
    // OpenDNS
    '208.67.222.222',
    '208.67.220.220'
  ],
  ntp: [
    'pool.ntp.org',
    'nist1-sj.ustiming.org'
  ]
}
