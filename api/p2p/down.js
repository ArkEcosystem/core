const Peer = require('./peer.js')
const logger = require('../../core/logger')

class Down {
  constructor (config) {
    this.config = config
    this.peers = {}
    config.network.peers.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, config)), this)
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
    let keys = Object.keys(this.peers)
    const that = this
    return Promise.all(keys.map(ip =>
      that.peers[ip]
        .ping()
        .catch(() => {
          delete that.peers[ip]
          return Promise.resolve(null)
        })
    ))
  }

  acceptNewPeer (peer) {
    if (this.peers[peer.ip]) return Promise.resolve()
    if (peer.nethash !== this.config.network.nethash) return Promise.reject(new Error('Request is made on the wrong network'))
    const npeer = new Peer(peer.ip, peer.port, this.config)
    return npeer.ping()
      .then(() => (this.peers[peer.ip] = npeer))
      .catch(e => logger.warn('Peer not connectable', npeer, e))
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
      logger.error(this.peers)
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
      logger.error(this.peers)
      delete this.peers[random]
      return this.getRandomPeer()
    }
    return randomPeer
  }

  discoverPeers () {
    const that = this
    return this.getRandomPeer().getPeers()
      .then((list) => {
        list.forEach(peer => {
          if (peer.status === 'OK' && !that.peers[peer.ip]) {
            that.peers[peer.ip] = new Peer(peer.ip, peer.port, that.config)
          }
        })
        return Promise.resolve(that.peers)
      })
      .catch(() => that.discoverPeers())
  }

  later (delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value))
  }

  getNetworkHeight () {
    const median = Object.values(this.peers)
      .filter(peer => peer.height)
      .map(peer => peer.height)
      .sort()
    return median[parseInt(median.length / 2)]  // changed from Promise.resolve
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
