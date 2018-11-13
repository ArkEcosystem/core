const prettyMs = require('pretty-ms')
const moment = require('moment')
const delay = require('delay')
const { flatten, groupBy } = require('lodash')
const pluralize = require('pluralize')

const { slots } = require('@arkecosystem/crypto')

const container = require('@arkecosystem/core-container')

const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

const Peer = require('./peer')
const { guard } = require('./court')
const networkState = require('./utils/network-state')

const checkDNS = require('./utils/check-dns')
const checkNTP = require('./utils/check-ntp')

class Monitor {
  /**
   * @constructor
   * @throws {Error} If no seed peers
   */
  constructor() {
    this.peers = {}
    this.startForgers = moment().add(config.peers.coldStart || 30, 'seconds')
  }

  /**
   * Method to run on startup.
   * @param {Object} options
   */
  async start(options) {
    this.config = options

    await this.__checkDNSConnectivity(options.dns)
    await this.__checkNTPConnectivity(options.ntp)

    this.guard = guard.init(this)

    this.__filterPeers()

    this.config.skipDiscovery
      ? logger.warn(
          'Skipped peer discovery because the relay is in skip-discovery mode.',
        )
      : await this.updateNetworkStatus(options.networkStart)

    return this
  }

  /**
   * Update network status (currently only peers are updated).
   * @param  {Boolean} networkStart
   * @return {Promise}
   */
  async updateNetworkStatus(networkStart) {
    if (networkStart) {
      logger.warn(
        'Skipped peer discovery because the relay is in genesis-start mode.',
      )
      return
    }

    if (this.config.disableDiscovery) {
      logger.warn(
        'Skipped peer discovery because the relay is in non-discovery mode.',
      )
      return
    }

    try {
      const realEnvironment = process.env.ARK_ENV !== 'test'

      if (realEnvironment) {
        await this.discoverPeers()
        await this.cleanPeers()
      }

      if (
        Object.keys(this.peers).length < config.peers.list.length - 1 &&
        realEnvironment
      ) {
        config.peers.list.forEach(peer => {
          this.peers[peer.ip] = new Peer(peer.ip, peer.port)
        }, this)

        return this.updateNetworkStatus()
      }
    } catch (error) {
      logger.error(`Network Status: ${error.message}`)

      config.peers.list.forEach(peer => {
        this.peers[peer.ip] = new Peer(peer.ip, peer.port)
      }, this)

      return this.updateNetworkStatus()
    }
  }

  /**
   * Accept and store a valid peer.
   * @param  {Peer} peer
   * @throws {Error} If invalid peer
   */
  async acceptNewPeer(peer) {
    if (this.config.disableDiscovery) {
      logger.warn(
        `Rejected ${peer.ip} because the relay is in non-discovery mode.`,
      )
      return
    }

    if (
      this.guard.isSuspended(peer) ||
      this.guard.isMyself(peer) ||
      process.env.ARK_ENV === 'test'
    ) {
      return
    }

    const newPeer = new Peer(peer.ip, peer.port)

    if (this.guard.isBlacklisted(peer.ip)) {
      logger.debug(`Rejected peer ${peer.ip} as it is blacklisted`)

      return this.guard.suspend(newPeer)
    }

    if (!this.guard.isValidVersion(peer) && !this.guard.isWhitelisted(peer)) {
      logger.debug(
        `Rejected peer ${
          peer.ip
        } as it doesn't meet the minimum version requirements. Expected: ${
          config.peers.minimumVersion
        } - Received: ${peer.version}`,
      )

      return this.guard.suspend(newPeer)
    }

    if (!this.guard.isValidNetwork(peer)) {
      logger.debug(
        `Rejected peer ${peer.ip} as it isn't on the same network. Expected: ${
          config.network.nethash
        } - Received: ${peer.nethash}`,
      )

      return this.guard.suspend(newPeer)
    }

    if (this.getPeer(peer.ip)) {
      return
    }

    try {
      await newPeer.ping(1500)

      this.peers[peer.ip] = newPeer

      logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`)

      emitter.emit('peer.added', newPeer)
    } catch (error) {
      logger.debug(
        `Could not accept new peer '${newPeer.ip}:${newPeer.port}' - ${error}`,
      )

      this.guard.suspend(newPeer)
    }
  }

  /**
   * Remove peer from monitor.
   * @param {Peer} peer
   */
  removePeer(peer) {
    delete this.peers[peer.ip]
  }

  /**
   * Clear peers which aren't responding.
   * @param {Boolean} fast
   */
  async cleanPeers(fast = false, tracker = true) {
    const keys = Object.keys(this.peers)
    let count = 0
    let unresponsivePeers = 0
    const pingDelay = fast ? 1500 : config.peers.globalTimeout
    const max = keys.length

    logger.info(`Checking ${max} peers :telescope:`)
    await Promise.all(
      keys.map(async ip => {
        const peer = this.getPeer(ip)
        try {
          await peer.ping(pingDelay)

          if (tracker) {
            logger.printTracker('Peers Discovery', ++count, max)
          }
        } catch (error) {
          unresponsivePeers++

          const formattedDelay = prettyMs(pingDelay, { verbose: true })
          logger.debug(
            `Removed peer ${ip} because it didn't respond within ${formattedDelay}.`,
          )
          emitter.emit('peer.removed', peer)

          this.removePeer(peer)

          return null
        }
      }),
    )

    if (tracker) {
      logger.stopTracker('Peers Discovery', max, max)
      logger.info(
        `${max -
          unresponsivePeers} of ${max} peers on the network are responsive`,
      )
      logger.info(`Median Network Height: ${this.getNetworkHeight()}`)
      logger.info(`Network PBFT status: ${this.getPBFTForgingStatus()}`)
    }
  }

  /**
   * Suspend an existing peer.
   * @param  {Peer} peer
   * @return {void}
   */
  suspendPeer(ip) {
    const peer = this.peers[ip]

    if (peer && !this.guard.isSuspended(peer)) {
      this.guard.suspend(peer)
    }
  }

  /**
   * Get a list of all suspended peers.
   * @return {void}
   */
  getSuspendedPeers() {
    return this.guard.all()
  }

  /**
   * Get all available peers.
   * @return {Peer[]}
   */
  getPeers() {
    return Object.values(this.peers)
  }

  /**
   * Get the peer available peers.
   * @param  {String} ip
   * @return {Peer}
   */
  getPeer(ip) {
    return this.peers[ip]
  }

  async peerHasCommonBlocks(peer, blockIds) {
    if (!this.guard.isMyself(peer) && !(await peer.hasCommonBlocks(blockIds))) {
      logger.error(`Could not get common block for ${peer.ip}`)

      peer.commonBlocks = false

      this.guard.suspend(peer)

      return false
    }

    return true
  }

  /**
   * Get a random, available peer.
   * @param  {(Number|undefined)} acceptableDelay
   * @return {Peer}
   */
  getRandomPeer(acceptableDelay, downloadSize, failedAttempts) {
    failedAttempts = failedAttempts === undefined ? 0 : failedAttempts

    const peers = this.getPeers().filter(peer => {
      if (peer.ban < new Date().getTime()) {
        return true
      }

      if (acceptableDelay && peer.delay < acceptableDelay) {
        return true
      }

      if (downloadSize && peer.downloadSize !== downloadSize) {
        return true
      }

      return false
    })

    const randomPeer = peers[(peers.length * Math.random()) << 0]
    if (!randomPeer) {
      failedAttempts++

      if (failedAttempts > 10) {
        throw new Error('Failed to find random peer')
      } else if (failedAttempts > 5) {
        return this.getRandomPeer(null, downloadSize, failedAttempts)
      }

      return this.getRandomPeer(acceptableDelay, downloadSize, failedAttempts)
    }

    return randomPeer
  }

  /**
   * Get a random, available peer which can be used for downloading blocks.
   * @return {Peer}
   */
  async getRandomDownloadBlocksPeer(minHeight) {
    const randomPeer = this.getRandomPeer(null, 100)

    const recentBlockIds = await this.__getRecentBlockIds()
    if (!(await this.peerHasCommonBlocks(randomPeer, recentBlockIds))) {
      return this.getRandomDownloadBlocksPeer(minHeight)
    }

    return randomPeer
  }

  /**
   * Populate list of available peers from random peers.
   * @return {Peer[]}
   */
  async discoverPeers() {
    try {
      const list = await this.getRandomPeer().getPeers()

      list.forEach(peer => {
        if (
          Peer.isOk(peer) &&
          !this.getPeer(peer.ip) &&
          !this.guard.isMyself(peer)
        ) {
          this.peers[peer.ip] = new Peer(peer.ip, peer.port)
        }
      })

      return this.peers
    } catch (error) {
      return this.discoverPeers()
    }
  }

  /**
   * Check if we have any peers.
   * @return {bool}
   */
  hasPeers() {
    return !!this.getPeers().length
  }

  /**
   * Get the median network height.
   * @return {Number}
   */
  getNetworkHeight() {
    const median = this.getPeers()
      .filter(peer => peer.state.height)
      .map(peer => peer.state.height)
      .sort()

    return median[~~(median.length / 2)]
  }

  /**
   * Get the PBFT Forging status.
   * @return {Number}
   */
  getPBFTForgingStatus() {
    const height = this.getNetworkHeight()
    const slot = slots.getSlotNumber()

    let allowedToForge = 0
    let syncedPeers = 0

    for (const peer of this.getPeers()) {
      if (peer.state) {
        if (peer.state.currentSlot === slot) {
          syncedPeers++

          if (peer.state.forgingAllowed && peer.state.height >= height) {
            allowedToForge++
          }
        }
      }
    }

    const pbft = allowedToForge / syncedPeers

    return isNaN(pbft) ? 0 : pbft
  }

  async getNetworkState() {
    if (!this.__isColdStartActive()) {
      await this.cleanPeers(true, false)
    }

    return networkState(
      this,
      container.resolvePlugin('blockchain').getLastBlock(),
    )
  }

  /**
   * Refresh all peers after a fork. Peers with no common blocks are
   * suspended.
   * @return {void}
   */
  async refreshPeersAfterFork() {
    logger.info(`Refreshing ${this.getPeers().length} peers after fork.`)

    // Reset all peers, except peers banned because of causing a fork.
    await this.guard.resetSuspendedPeers()

    // Ban peer who caused the fork
    const forkedBlock = container.resolve('state').forkedBlock
    if (forkedBlock) {
      this.suspendPeer(forkedBlock.ip)
    }

    const recentBlockIds = await this.__getRecentBlockIds()

    await Promise.all(
      this.getPeers().map(peer =>
        this.peerHasCommonBlocks(peer, recentBlockIds),
      ),
    )
  }

  /**
   * Download blocks from a random peer.
   * @param  {Number}   fromBlockHeight
   * @return {Object[]}
   */
  async downloadBlocks(fromBlockHeight) {
    let randomPeer

    try {
      randomPeer = await this.getRandomDownloadBlocksPeer(fromBlockHeight)
    } catch (error) {
      logger.error(`Could not download blocks: ${error.message}`)

      return []
    }
    try {
      logger.info(
        `Downloading blocks from height ${fromBlockHeight.toLocaleString()} via ${
          randomPeer.ip
        }`,
      )

      const blocks = await randomPeer.downloadBlocks(fromBlockHeight)
      blocks.forEach(block => {
        block.ip = randomPeer.ip
      })

      return blocks
    } catch (error) {
      logger.error(`Could not download blocks: ${error.message}`)

      return this.downloadBlocks(fromBlockHeight)
    }
  }

  /**
   * Broadcast block to all peers.
   * @param  {Block}   block
   * @return {Promise}
   */
  async broadcastBlock(block) {
    const blockchain = container.resolvePlugin('blockchain')

    if (!blockchain) {
      logger.info(
        `Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`,
      )
      return
    }

    let blockPing = blockchain.getBlockPing()
    let peers = this.getPeers()

    if (blockPing && blockPing.block.id === block.data.id) {
      // wait a bit before broadcasting if a bit early
      const diff = blockPing.last - blockPing.first
      const maxHop = 4
      let proba = (maxHop - blockPing.count) / maxHop

      if (diff < 500 && proba > 0) {
        await delay(500 - diff)

        blockPing = blockchain.getBlockPing()

        // got aleady a new block, no broadcast
        if (blockPing.block.id !== block.data.id) {
          return
        }

        proba = (maxHop - blockPing.count) / maxHop
      }

      // TODO: to be put in config?
      peers = peers.filter(p => Math.random() < proba)
    }

    logger.info(
      `Broadcasting block ${block.data.height.toLocaleString()} to ${
        peers.length
      } peers`,
    )

    await Promise.all(peers.map(peer => peer.postBlock(block.toJson())))
  }

  /**
   * Placeholder method to broadcast transactions to peers.
   * @param {Transaction[]} transactions
   */
  async broadcastTransactions(transactions) {
    const peers = this.getPeers()
    logger.debug(
      `Broadcasting ${pluralize(
        'transaction',
        transactions.length,
        true,
      )} to ${pluralize('peer', peers.length, true)}`,
    )

    const transactionsV1 = []
    transactions.forEach(transaction =>
      transactionsV1.push(transaction.toJson()),
    )

    return Promise.all(peers.map(peer => peer.postTransactions(transactionsV1)))
  }

  /**
   * Update all peers based on height and last block id.
   *
   * Grouping peers by height and then by common id results in one of the following
   * scenarios:
   *
   *  1) Same height, same common id
   *  2) Same height, mixed common id
   *  3) Mixed height, same common id
   *  4) Mixed height, mixed common id
   *
   * Scenario 1: Do nothing.
   * Scenario 2-4:
   *  - If own height is ahead of majority do nothing for now.
   *  - Pick most common id from peers with most common height and calculate quota,
   *    depending on which the node rolls back or waits.
   *
   * NOTE: Only called when the network is consecutively missing blocks `p2pUpdateCounter` times.
   * @return {String}
   */
  async updatePeersOnMissingBlocks() {
    // First ping all peers to get updated heights and remove unresponsive ones.
    if (!this.__isColdStartActive()) {
      await this.cleanPeers(true, false)
    }

    const peersGroupedByHeight = groupBy(this.getPeers(), 'state.height')
    const commonHeightGroups = Object.values(peersGroupedByHeight).sort(
      (a, b) => b.length - a.length,
    )
    const peersMostCommonHeight = commonHeightGroups[0]
    const groupedByCommonId = groupBy(peersMostCommonHeight, 'state.header.id')
    const commonIdGroupCount = Object.keys(groupedByCommonId).length
    let state = ''

    if (commonHeightGroups.length === 1 && commonIdGroupCount === 1) {
      // No need to do anything.
      return state
    }

    const lastBlock = container.resolve('state').getLastBlock()

    // Do nothing if majority of peers are lagging behind
    if (commonHeightGroups.length > 1) {
      if (lastBlock.data.height > peersMostCommonHeight[0].state.height) {
        logger.info(
          `${pluralize(
            'peer',
            peersMostCommonHeight.length,
            true,
          )} are at height ${
            peersMostCommonHeight[0].state.height
          } and lagging behind last height ${lastBlock.data.height}. :zzz:`,
        )
        return state
      }
    }

    // Sort common id groups by length DESC
    const commonIdGroups = Object.values(groupedByCommonId).sort(
      (a, b) => b.length - a.length,
    )

    // Peers are sitting on the same height, but there might not be enough
    // quorum to move on, because of different last blocks.
    if (commonIdGroupCount > 1) {
      const chosenPeers = commonIdGroups[0]
      const restGroups = commonIdGroups.slice(1)

      if (restGroups.some(group => group.length === chosenPeers.length)) {
        logger.warning(
          'Peers are evenly split at same height with different block ids. :zap:',
        )
      }

      logger.info(
        `Detected peers at the same height ${
          peersMostCommonHeight[0].state.height
        } with different block ids: ${JSON.stringify(
          Object.keys(groupedByCommonId).map(
            k => `${k}: ${groupedByCommonId[k].length}`,
          ),
          null,
          4,
        )}`,
      )

      const badLastBlock =
        chosenPeers[0].state.height === lastBlock.data.height &&
        chosenPeers[0].state.header.id !== lastBlock.data.id
      const quota = chosenPeers.length / flatten(commonIdGroups).length
      if (badLastBlock && quota >= 0.66) {
        // Rollback if last block is bad and quota high
        logger.info(
          `Last block id ${
            lastBlock.data.id
          } is bad. Going to rollback. :repeat:`,
        )
        state = 'rollback'
      } else if (quota < 0.66) {
        // or quota too low TODO: find better number
        logger.info(
          `Common id quota '${quota}' is too low. Going to rollback. :repeat:`,
        )
        state = 'rollback'
      }

      if (state === 'rollback') {
        // Ban all rest peers
        const peersToBan = flatten(restGroups)
        peersToBan.forEach(peer => {
          peer.commonId = false
          this.suspendPeer(peer.ip)
        })

        logger.debug(
          `Banned ${pluralize('peer', peersToBan.length, true)} at height '${
            peersMostCommonHeight[0].state.height
          }' which do not have common id '${chosenPeers[0].state.header.id}'.`,
        )
      } else {
        logger.info(`But got enough common id quota: ${quota} :sparkles:`)
      }
    } else {
      // Under certain circumstances the headers can be missing (i.e. seed peers when starting up)
      const commonHeader = peersMostCommonHeight[0].state.header
      logger.info(
        `All peers at most common height ${
          peersMostCommonHeight[0].state.height
        } share the same block id${
          commonHeader ? ` '${commonHeader.id}'` : ''
        }. :pray:`,
      )
    }

    return state
  }

  /**
   * Filter the initial seed list.
   * @return {void}
   */
  __filterPeers() {
    if (!config.peers.list) {
      container.forceExit('No seed peers defined in peers.json :interrobang:')
    }

    const filteredPeers = config.peers.list.filter(
      peer => !this.guard.isMyself(peer) || !this.guard.isValidPort(peer),
    )

    // if (!filteredPeers.length) {
    //   logger.error('No external peers found in peers.json :interrobang:')

    //   process.exit(1)
    // }

    for (const peer of filteredPeers) {
      this.peers[peer.ip] = new Peer(peer.ip, peer.port)
    }
  }

  /**
   * Get last 10 block IDs from database.
   * @return {[]String}
   */
  async __getRecentBlockIds() {
    return container.resolvePlugin('database').getRecentBlockIds()
  }

  /**
   * Determines if coldstart is still active.
   * We need this for the network to start, so we dont forge, while
   * not all peers are up, or the network is not active
   */
  __isColdStartActive() {
    return this.startForgers > moment()
  }

  /**
   * Check if the node can connect to any DNS host.
   * @return {void}
   */
  async __checkDNSConnectivity(options) {
    try {
      const host = await checkDNS(options)

      logger.info(`Your network connectivity has been verified by ${host}`)
    } catch (error) {
      logger.error(error.message)
    }
  }

  /**
   * Check if the node can connect to any NTP host.
   * @return {void}
   */
  async __checkNTPConnectivity(options) {
    try {
      const { host, time } = await checkNTP(options)

      logger.info(`Your NTP connectivity has been verified by ${host}`)

      logger.info(
        `Local clock is off by ${parseInt(time.t)}ms from NTP :alarm_clock:`,
      )
    } catch (error) {
      logger.error(error.message)
    }
  }
}

module.exports = new Monitor()
