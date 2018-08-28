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

    const { until, reason } = this.__determineSuspensionTime(peer)

    this.suspensions[peer.ip] = { peer, until, reason }

    delete this.monitor.peers[peer.ip]
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
      const untilDiff = moment.duration(suspendedPeer.until.diff(moment.now()))

      logger.debug(`${peer.ip} still suspended for ${Math.ceil(untilDiff.asMinutes())} minutes because of "${suspendedPeer.reason}".`)

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
    const createMoment = (number, period, reason) => {
      const until = moment().utc().add(number, period)
      const untilDiff = moment.duration(until.diff(moment.now()))

      logger.debug(`Suspended ${peer.ip} for ${Math.ceil(untilDiff.asMinutes())} minutes because of "${reason}"`)

      return { until, reason }
    }

    // 1. Blacklisted
    if (this.isBlacklisted(peer)) {
      return createMoment(1, 'day', 'Blacklisted')
    }

    // 2. Wrong version
    if (!this.isValidVersion(peer)) {
      return createMoment(6, 'hours', 'Invalid Version')
    }

    // 3. Node is not at height
    // NOTE: Suspending this peer only means that we no longer
    // will download blocks from him but he can still download blocks from us.
    const heightDifference = Math.abs(this.monitor.getNetworkHeight() - peer.state.height)

    if (heightDifference >= 153) {
      return createMoment(10, 'minutes', 'Node is not at height')
    }

    // 4. Faulty Response
    // NOTE: We check this extra because a response can still succeed if
    // it returns any codes that are not 4xx or 5xx.
    if (peer.status !== 200) {
      return createMoment(5, 'minutes', 'Invalid Response Status')
    }

    // 5. Timeout or potentially a Request Error
    if (peer.delay === -1) {
      return createMoment(2, 'minutes', 'Timeout')
    }

    // 6. High Latency
    if (peer.delay > 2000) {
      return createMoment(1, 'minutes', 'High Latency')
    }

    // Any cases we are unable to make a decision on
    return createMoment(30, 'minutes', 'Unknown')
  }
}

module.exports = new Guard()
