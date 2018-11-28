const app = require('@arkecosystem/core-container')
const dayjs = require('dayjs-ext')
const head = require('lodash/head')
const prettyMs = require('pretty-ms')
const semver = require('semver')
const sumBy = require('lodash/sumBy')

const config = app.resolvePlugin('config')
const logger = app.resolvePlugin('logger')

const isMyself = require('../utils/is-myself')
const offences = require('./offences')

class Guard {
  /**
   * Create a new guard instance.
   */
  constructor() {
    this.suspensions = {}
  }

  /**
   * Initialise a new guard.
   * @param {Monitor} monitor
   */
  init(monitor) {
    this.monitor = monitor

    return this
  }

  /**
   * Get a list of all suspended peers.
   * @return {Object}
   */
  all() {
    return this.suspensions
  }

  /**
   * Get the suspended peer for the give IP.
   * @return {Object}
   */
  get(ip) {
    return this.suspensions[ip]
  }

  /**
   * Suspends a peer unless whitelisted.
   * @param {Peer} peer
   */
  suspend(peer) {
    if (config.peers.whiteList && config.peers.whiteList.includes(peer.ip)) {
      return
    }

    if (peer.offences.length > 0) {
      if (dayjs().isAfter(head(peer.offences).until)) {
        peer.offences = []
      }
    }

    const offence = this.__determineOffence(peer)

    peer.offences.push(offence)

    this.suspensions[peer.ip] = {
      peer,
      until: offence.until,
      reason: offence.reason,
    }

    this.monitor.removePeer(peer)
  }

  /**
   * Remove a suspended peer.
   * @param {Peer} peer
   * @return {void}
   */
  async unsuspend(peer) {
    if (!this.suspensions[peer.ip]) {
      return
    }

    // Don't unsuspend critical offenders before the ban is expired.
    if (peer.offences.some(offence => offence.critical)) {
      if (dayjs().isBefore(this.suspensions[peer.ip].until)) {
        return
      }
    }

    delete this.suspensions[peer.ip]
    delete peer.nextSuspensionReminder

    await this.monitor.acceptNewPeer(peer)
  }

  /**
   * Reset suspended peers
   * @return {void}
   */
  async resetSuspendedPeers() {
    logger.info('Clearing suspended peers.')
    await Promise.all(
      Object.values(this.suspensions).map(suspension =>
        this.unsuspend(suspension.peer),
      ),
    )
  }

  /**
   * Determine if peer is suspended or not.
   * @param  {Peer} peer
   * @return {Boolean}
   */
  isSuspended(peer) {
    const suspendedPeer = this.get(peer.ip)

    if (suspendedPeer && dayjs().isBefore(suspendedPeer.until)) {
      const nextSuspensionReminder = suspendedPeer.nextSuspensionReminder

      if (!nextSuspensionReminder || dayjs().isAfter(nextSuspensionReminder)) {
        const untilDiff = suspendedPeer.until.diff(dayjs())

        logger.debug(
          `${peer.ip} still suspended for ${prettyMs(untilDiff, {
            verbose: true,
          })} because of "${suspendedPeer.reason}".`,
        )

        suspendedPeer.nextSuspensionReminder = dayjs().add(5, 'm')
      }

      return true
    }

    if (suspendedPeer) {
      delete this.suspensions[peer.ip]
    }

    return false
  }

  /**
   * Determine if the peer is whitelisted.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isWhitelisted(peer) {
    return config.peers.whiteList.includes(peer.ip)
  }

  /**
   * Determine if the peer is blacklisted.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isBlacklisted(peer) {
    return config.peers.blackList.includes(peer.ip)
  }

  /**
   * Determine if the peer is within the version constraints.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isValidVersion(peer) {
    const version = peer.version || (peer.headers && peer.headers.version)
    return semver.satisfies(version, config.peers.minimumVersion)
  }

  /**
   * Determine if the peer is on the right network.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isValidNetwork(peer) {
    const nethash = peer.nethash || (peer.headers && peer.headers.nethash)
    return nethash === config.network.nethash
  }

  /**
   * Determine if the peer has a valid port.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isValidPort(peer) {
    return peer.port === app.resolveOptions('p2p').port
  }

  /**
   * Determine if the peer is localhost.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isMyself(peer) {
    return isMyself(peer.ip)
  }

  /**
   * Decide if the given peer is a repeat offender.
   * @param  {Object}  peer
   * @return {Boolean}
   */
  isRepeatOffender(peer) {
    return sumBy(peer.offences, 'weight') >= 150
  }

  /**
   * Decide for how long the peer should be banned.
   * @param  {Peer}  peer
   * @return {dayjs}
   */
  __determineOffence(peer) {
    if (this.isBlacklisted(peer)) {
      return this.__determinePunishment(peer, offences.BLACKLISTED)
    }

    try {
      const state = app.resolve('state')

      if (state.forkedBlock && peer.ip === state.forkedBlock.ip) {
        return this.__determinePunishment(peer, offences.FORK)
      }
    } catch (error) {
      logger.warn(
        `The state storage is not ready, skipped fork check for ${peer.ip}.`,
      )
    }

    if (peer.commonBlocks === false) {
      delete peer.commonBlocks

      return this.__determinePunishment(peer, offences.NO_COMMON_BLOCKS)
    }

    if (peer.commonId === false) {
      delete peer.commonId

      return this.__determinePunishment(peer, offences.NO_COMMON_ID)
    }

    // NOTE: We check this extra because a response can still succeed if
    // it returns any codes that are not 4xx or 5xx.
    if (peer.status === 503) {
      return this.__determinePunishment(peer, offences.BLOCKCHAIN_NOT_READY)
    }

    if (peer.status === 429) {
      return this.__determinePunishment(peer, offences.TOO_MANY_REQUESTS)
    }

    if (peer.status && peer.status !== 200) {
      return this.__determinePunishment(peer, offences.INVALID_STATUS)
    }

    if (peer.delay === -1) {
      return this.__determinePunishment(peer, offences.TIMEOUT)
    }

    if (peer.delay > 2000) {
      return this.__determinePunishment(peer, offences.HIGH_LATENCY)
    }

    if (!this.isValidNetwork(peer)) {
      return this.__determinePunishment(peer, offences.INVALID_NETWORK)
    }

    if (!this.isValidVersion(peer)) {
      return this.__determinePunishment(peer, offences.INVALID_VERSION)
    }

    // NOTE: Suspending this peer only means that we no longer
    // will download blocks from him but he can still download blocks from us.
    const heightDifference = Math.abs(
      this.monitor.getNetworkHeight() - peer.state.height,
    )

    if (heightDifference >= 153) {
      return this.__determinePunishment(peer, offences.INVALID_HEIGHT)
    }

    return this.__determinePunishment(peer, offences.UNKNOWN)
  }

  /**
   * Compile the information about the punishment the peer will face.
   * @param  {Object} peer
   * @param  {Object} offence
   * @return {Object}
   */
  __determinePunishment(peer, offence) {
    if (this.isRepeatOffender(peer)) {
      offence = offences.REPEAT_OFFENDER
    }

    const until = dayjs().add(offence.number, offence.period)
    const untilDiff = until.diff(dayjs())

    logger.debug(
      `Suspended ${peer.ip} for ${prettyMs(untilDiff, {
        verbose: true,
      })} because of "${offence.reason}"`,
    )

    return {
      until,
      reason: offence.reason,
      weight: offence.weight,
    }
  }
}

module.exports = new Guard()
