const Peer = require('./peer')
const logger = require('../../core/logger')
const dns = require('dns')
const isLocalhost = require('../../utils/is-localhost')
const webhookManager = require('../../core/managers/webhook')

module.exports = class Down {
  constructor (config) {
    this.config = config
    this.peers = {}
    config.network.peers
      .filter(peer => (peer.ip !== '127.0.0.1' || peer.port !== this.config.server.port))
      .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, config)), this)
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
      if (!this.config.server.test) await this.discoverPeers()
      if (!this.config.server.test) await this.cleanPeers()

      if (Object.keys(this.peers).length < this.config.network.peers.length - 1 && !this.config.server.test) {
        this.config.network.peers
          .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

        return this.updateNetworkStatus()
      }
    } catch (error) {
      logger.error(error.stack)

      this.config.network.peers.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

      return this.updateNetworkStatus()
    }
  }

  stop () {
    // Noop
  }

  async cleanPeers () {
    let keys = Object.keys(this.peers)
    let count = 0
    const max = keys.length
    let wrongpeers = 0

    logger.info('Looking for network peers')

    await Promise.all(keys.map(async (ip) => {
      try {
        await this.peers[ip].ping()
        logger.printTracker('Peers Discovery', ++count, max, null, null)
      } catch (error) {
        wrongpeers++
        delete this.peers[ip]

        webhookManager.getInstance().emit('peer.removed', this.peers[ip])

        return null
      }
    }))

    logger.stopTracker('Peers Discovery', max, max)
    logger.info(`Found ${max - wrongpeers}/${max} responsive peers on the network`)
  }

  async acceptNewPeer (peer) {
    if (this.peers[peer.ip]) return
    if (peer.nethash !== this.config.network.nethash) throw new Error('Request is made on the wrong network')
    if (peer.ip === '::ffff:127.0.0.1') throw new Error('Localhost peer not accepted')
    const npeer = new Peer(peer.ip, peer.port, this.config)

    try {
      await npeer.ping()
      this.peers[peer.ip] = npeer

      webhookManager.getInstance().emit('peer.added', npeer)
    } catch (error) {
      logger.debug(`Peer ${npeer} not connectable - ${error}`)
    }
  }

  async getPeers () {
    return Object.values(this.peers)
  }

  getRandomPeer (delay) {
    let keys = Object.keys(this.peers)
    keys = keys.filter((key) => this.peers[key].ban < new Date().getTime())
    if (delay) keys = keys.filter((key) => this.peers[key].delay < delay)
    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]
    if (!randomPeer) {
      // logger.error(this.peers)
      delete this.peers[random]
      this.isOnline(online => {
        if (!online) logger.error('Seems the noe cannott access to internet (tested google DNS)')
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
      // logger.error(this.peers)
      delete this.peers[random]
      return this.getRandomPeer()
    }
    return randomPeer
  }

  async discoverPeers () {
    try {
      const list = await this.getRandomPeer().getPeers()

      list.forEach(peer => {
        if (peer.status === 'OK' && !this.peers[peer.ip] && !isLocalhost(peer.ip)) {
          this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)
        }
      })

      return this.peers
    } catch (error) {
      this.discoverPeers()
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

    try {
      await randomPeer.ping()

      return randomPeer.downloadBlocks(fromBlockHeight)
    } catch (error) {
      return this.downloadBlocks(fromBlockHeight)
    }
  }

  broadcastBlock (block) {
    const bpeers = Object.values(this.peers)
    // console.log(Object.values(this.peers))
    logger.info(`Broadcasting block ${block.data.height} to ${bpeers.length} peers`)
    return Promise.all(bpeers.map((peer) => peer.postBlock(block.toBroadcastV1())))
  }

  broadcastTransactions (transactions) {

  }
}
