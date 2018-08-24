'use strict'

const moment = require('moment')
const semver = require('semver')
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const isMyself = require('./utils/is-myself')

class Guard {
  /**
   * Create a new guard instance.
   */
  constructor () {
    this.suspensions = {}
  }

  /**
   * Initialise a new guard.
   * @param {Monitor} monitor
   */
  init (monitor) {
    this.monitor = monitor

    return this
  }

  /**
   * Get a list of all suspended peers.
   * @return {Object}
   */
  all () {
    return this.suspensions
  }

  /**
   * Get the suspended peer for the give IP.
   * @return {Object}
   */
  get (ip) {
    return this.suspensions[ip]
  }

  /**
   * Suspends a peer unless whitelisted.
   * @param {Peer} peer
   */
  suspend (peer) {
    if (config.peers.whiteList && config.peers.whiteList.includes(peer.ip)) {
      return
    }

    const until = this.__determineSuspensionTime(peer)

    this.suspensions[peer.ip] = {
      peer,
      until,
      untilHuman: until.format('h [hrs], m [min]')
    }

    delete this.monitor.peers[peer.ip]

    logger.debug(`Suspended ${peer.ip} for ` + this.get(peer.ip).untilHuman)
  }

  /**
   * Remove a suspended peer.
   * @param {Peer} peer
   * @return {void}
   */
  async unsuspend (peer) {
    if (!this.suspensions[peer.ip]) {
      return
    }

    delete this.suspensions[peer.ip]

    await this.monitor.acceptNewPeer(peer)
  }

  /**
   * Reset suspended peer list.
   * @return {void}
   */
  async resetSuspendedPeers () {
    logger.info('Clearing suspended peers')
    for (const ip of Object.keys(this.suspensions)) {
      await this.unsuspend(this.get(ip).peer)
    }
  }

  /**
   * Determine if peer is suspended or not.
   * @param  {Peer} peer
   * @return {Boolean}
   */
  isSuspended (peer) {
    const suspendedPeer = this.get(peer.ip)

    if (suspendedPeer && moment().isBefore(suspendedPeer.until)) {
      logger.debug(`${peer.ip} still suspended for ` + suspendedPeer.untilHuman)

      return true
    } else if (suspendedPeer) {
      delete this.suspensions[peer.ip]
    }

    return false
  }

  /**
   * Determine if the peer is whitelisted.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isWhitelisted (peer) {
    return config.peers.whiteList.includes(peer.ip)
  }

  /**
   * Determine if the peer is blacklisted.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isBlacklisted (peer) {
    return config.peers.blackList.includes(peer.ip)
  }

  /**
   * Determine if the peer is within the version constraints.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isValidVersion (peer) {
    return semver.satisfies(peer.version, config.peers.minimumVersion)
  }

  /**
   * Determine if the peer has a valid port.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isValidPort (peer) {
    return peer.port === container.resolveOptions('p2p').port
  }

  /**
   * Determine if the peer is localhost.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isMyself (peer) {
    return isMyself(peer.ip)
  }

  /**
   * Determine for how long the peer should be banned.
   * @param  {Peer}  peer
   * @return {moment}
   */
  __determineSuspensionTime (peer) {
    // 1. Wrong version
    if (!this.isValidVersion(peer)) {
      return moment().add(6, 'hours')
    }

    // 2. Node is not at height
    const heightDifference = Math.abs(this.getNetworkHeight() - peer.state.height)

    if (heightDifference >= 153) {
      return moment().add(30, 'minutes')
    }

    // 3. Faulty Response
    // NOTE: We check this extra because a response can still succeed if
    // it returns any codes that are not 4xx or 5xx.
    if (peer.status !== 200) {
      return moment().add(5, 'minutes')
    }

    // 4. Timeout or potentially a Request Error
    if (peer.delay === -1) {
      return moment().add(2, 'minutes')
    }

    // 5. High Latency
    if (peer.delay > 2000) {
      return moment().add(1, 'minutes')
    }

    // Any cases we are unable to make a decision on
    return moment().add(30, 'minutes')
  }
}

module.exports = new Guard()
