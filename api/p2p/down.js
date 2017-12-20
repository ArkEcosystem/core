const Peer = require('./peer.js')
const logger = require('../../core/logger')

class Down {
  constructor (config) {
    this.config = config
    this.peers = {}
    config.network.peers.forEach(({ ip, port }) => {
      this.peers[ip] = new Peer(ip, port, config)
    })
  }

  start (p2p) {
    this.p2p = p2p
    return this.updateNetworkStatus()
  }

  updateNetworkStatus () {
    return this
      .cleanPeers()
      .then(() => this.discoverPeers())
      .then(() => this.cleanPeers())
  }

  stop () {
    // Noop
  }

  cleanPeers () {
    const keys = Object.keys(this.peers)
    return Promise.all(keys.map(ip =>
      this.peers[ip]
        .ping()
        .catch(() => {
          delete this.peers[ip]
          logger.info('Peer cleaned at', ip)
          return Promise.resolve(null)
        })
    ))
  }

  acceptNewPeer (peer) {
    if (this.peers[peer.ip]) return Promise.resolve()

    if (peer.nethash !== this.config.network.nethash) {
      return Promise.reject(new Error('Request is made on the wrong network'))
    }

    const newPeer = new Peer(peer.ip, peer.port, this.config)
    return newPeer.ping()
      .then(() => this.peers[peer.ip] = newPeer)
      .catch(error => logger.warn('Peer not connectable', newPeer, error))
  }

  getPeers () {
    return Promise.resolve(Object.values(this.peers))
  }

  getRandomPeer (delay) {
    let keys = Object.keys(this.peers)
    keys = keys.filter((key) => this.peers[key].ban < new Date().getTime())
    if (delay) keys = keys.filter((key) => this.peers[key].delay < delay)
    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]
    if (!randomPeer) {
      logger.error('Not random peer', this.peers)
      delete this.peers[random]
      return this.getRandomPeer()
    }
    return randomPeer
  }

  getRandomDownloadBlocksPeer () {
    let keys = Object.keys(this.peers)
    keys = keys.filter(key => this.peers[key].ban < new Date().getTime())
    keys = keys.filter(key => this.peers[key].delay < 2000 && this.peers[key].downloadSize !== 100)
    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]
    if (!randomPeer) {
      logger.error('Not random peer', this.peers)
      delete this.peers[random]
      return this.getRandomPeer()
    }
    return randomPeer
  }

  discoverPeers () {
    return this.getRandomPeer().getPeers()
      .then(peersData => {
        // TODO uxe it?
        // if (!peersData || !peersData.length) {
        //   throw new Error('No peers have been found')
        // }
        peersData.forEach(({ ip, port, status }) => {
          if (status === 'OK' && !this.peers[ip]) {
            this.peers[ip] = new Peer(ip, port, this.config)
          }
        })
        return Promise.resolve(this.peers)
      })
      .catch(() => this.discoverPeers())
  }

  later (delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value))
  }

  getNetworkHeight () {
    const median = Object.values(this.peers)
      .filter(peer => peer.height)
      .map(peer => peer.height)
      .sort()
    return Promise.resolve(median[parseInt(median.length / 2)])
  }

  downloadBlocks (fromBlockHeight) {
    const randomPeer = this.getRandomDownloadBlocksPeer()
    logger.info('Downloading blocks from', randomPeer.url, 'from block', fromBlockHeight)
    return randomPeer
      .ping()
      .then(() => randomPeer.downloadBlocks(fromBlockHeight))
      .catch(() => this.downloadBlocks(fromBlockHeight))
  }
}

module.exports = Down
