'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')

const moment = require('moment')
const semver = require('semver')
const { head, sumBy } = require('lodash')

const isMyself = require('../utils/is-myself')
const offences = require('./offences')

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

    if (peer.offences.length > 0) {
      if (moment().isAfter(head(peer.offences).until)) {
        peer.offences = []
      }
    }

    const offence = this.__determineOffence(peer)

    peer.offences.push(offence)

    this.suspensions[peer.ip] = {
      peer,
      until: offence.until,
      reason: offence.reason
    }

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
   * Determine if the peer is on the right network.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isValidNetwork (peer) {
    return peer.nethash === config.network.nethash
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
   * Decide if the given peer is a repeat offender.
   * @param  {Object}  peer
   * @return {Boolean}
   */
  isRepeatOffender (peer) {
    return sumBy(peer.offences, 'weight') >= 150
  }

  /**
   * Decide for how long the peer should be banned.
   * @param  {Peer}  peer
   * @return {moment}
   */
  __determineOffence (peer) {
    if (this.isBlacklisted(peer)) {
      return this.__determinePunishment(peer, offences.BLACKLISTED)
    }

    // NOTE: We check this extra because a response can still succeed if
    // it returns any codes that are not 4xx or 5xx.
    if (peer.status !== 200) {
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
    const heightDifference = Math.abs(this.monitor.getNetworkHeight() - peer.state.height)

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
  __determinePunishment (peer, offence) {
    if (this.isRepeatOffender(peer)) {
      offence = offences.REPEAT_OFFENDER
    }

    const until = moment().utc().add(offence.number, offence.period)
    const untilDiff = moment.duration(until.diff(moment.now()))

    logger.debug(`Suspended ${peer.ip} for ${Math.ceil(untilDiff.asMinutes())} minutes because of "${offence.reason}"`)

    return {
      until,
      reason: offence.reason,
      weight: offence.weight
    }
  }
}

module.exports = new Guard()
