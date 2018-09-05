const peer1 = {
  ip: '1.1.1.1',
  port: 4002,
  version: '1.1.1',
  errors: 0,
  os: 'linux',
  height: 3663605,
  status: 'OK',
  delay: 217
}
const peer2 = {
  ip: '2.2.2.2',
  port: 4002,
  version: '1.1.1',
  errors: 0,
  os: 'linux',
  height: 3663608,
  status: 'OK',
  delay: 21
}
const peer3 = {
  ip: '3.3.3.3',
  port: 4002,
  version: '1.1.1',
  errors: 0,
  os: 'linux',
  height: 3663600,
  status: 'OK',
  delay: 19
}
const peer4 = {
  ip: '4.4.4.4',
  port: 4002,
  version: '1.1.1',
  errors: 0,
  os: 'linux',
  height: 3663605,
  status: 'OK',
  delay: 17
}

exports.peers = [peer1, peer2, peer3, peer4]

exports.peer1 = peer1
exports.peer2 = peer2
exports.peer3 = peer3
exports.peer4 = peer4

exports.peersOverride = [
  {
    ip: '1.2.3.4',
    port: 4003
  },
  {
    ip: '5.6.7.8',
    port: 4003
  }
]
