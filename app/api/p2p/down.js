const Peer = require('./peer')
const goofy = require('app/core/goofy')
const dns = require('dns')

const isLocalhost = ip => ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1'

class Down {
  constructor (config) {
    this.config = config
    this.peers = {}
    config.network.peers.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, config)), this)
  }

  isOnline () {
    dns.lookupService('8.8.8.8', 53, (err, hostname, service) => !err)
  }

  start (p2p) {
    this.p2p = p2p
    return this.updateNetworkStatus()
  }

  async updateNetworkStatus () {
    try {
      await this.discoverPeers()
      await this.cleanPeers()

      if (Object.keys(this.peers).length < this.config.network.peers.length) {
        this.config.network.peers.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

        return this.updateNetworkStatus()
      }
    } catch (error) {
      goofy.error(error)

      this.config.network.peers.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

      return this.updateNetworkStatus()
    }
  }

  stop () {
    // Noop
  }

  async cleanPeers () {
    let keys = Object.keys(this.peers)
    const that = this
    let count = 0
    const max = keys.length
    let wrongpeers = 0

    goofy.info('Looking for network peers')

    await Promise.all(keys.map(async ip => {
      try {
        that.peers[ip].ping()

        goofy.printTracker('Peers Discovery', ++count, max, null, null)
      } catch (error) {
        wrongpeers++

        delete that.peers[ip]

        return null
      }
    }))

    goofy.stopTracker('Peers Discovery', max, max)
    goofy.info(`Found ${max - wrongpeers}/${max} responsive peers on the network`)
  }

  async acceptNewPeer (peer) {
    if (this.peers[peer.ip]) return

    if (peer.nethash !== this.config.network.nethash) {
      throw new Error('Request is made on the wrong network')
    }

    if (peer.ip === '::ffff:127.0.0.1') {
      throw new Error('Localhost peer not accepted')
    }

    const npeer = new Peer(peer.ip, peer.port, this.config)
    try {
      await npeer.ping()
      this.peers[peer.ip] = npeer
    } catch (error) {
      goofy.debug('Peer not connectable', npeer, error)
    }
  }

  async getPeers () {
    return Object.values(this.peers)
  }

  getRandomPeer (delay) {
    let keys = Object.keys(this.peers)
    keys = keys.filter((key) => this.peers[key].ban < new Date().getTime())
    if (delay) {
      keys = keys.filter((key) => this.peers[key].delay < delay)
    }

    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]

    if (!randomPeer) {
      delete this.peers[random]

      this.isOnline(online => {
        if (!online) {
          goofy.error('Seems the node cannot access the internet according to Google DNS.')
        }
      })

      return this.getRandomPeer()
    }

    return randomPeer
  }

  getRandomDownloadBlocksPeer () {
    let keys = Object.keys(this.peers)
    keys = keys.filter(key => this.peers[key].ban < new Date().getTime())
    keys = keys.filter(key => this.peers[key].downloadSize !== 100)

    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]

    if (!randomPeer) {
      // goofy.error(this.peers)
      delete this.peers[random]

      return this.getRandomPeer()
    }

    return randomPeer
  }

  async discoverPeers () {
    const that = this
    try {
      const list = await this.getRandomPeer().getPeers()

      list.forEach(peer => {
        if (peer.status === 'OK' && !that.peers[peer.ip] && !isLocalhost(peer.ip)) {
          that.peers[peer.ip] = new Peer(peer.ip, peer.port, that.config)
        }
      })

      return that.peers
    } catch (error) {
      that.discoverPeers()
    }
  }

  later (delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value))
  }

  async getNetworkHeight () {
    const median = Object.values(this.peers)
      .filter(peer => peer.height)
      .map(peer => peer.height)
      .sort()

    return median[parseInt(median.length / 2)]
  }

  async downloadBlocks (fromBlockHeight) {
    const randomPeer = this.getRandomDownloadBlocksPeer()

    goofy.info('Downloading blocks from', randomPeer.url, 'from block', fromBlockHeight)

    try {
      await randomPeer.ping()

      return randomPeer.downloadBlocks(fromBlockHeight)
    } catch (error) {
      return this.downloadBlocks(fromBlockHeight)
    }
  }

  broadcastBlock (block) {
    return Promise.all(Object.values(this.peers).map((peer) => peer.broadcastBlock(block.toBroadcastV1())))
  }

  broadcastTransactions (transactions) {
    //
  }
}

module.exports = Down
