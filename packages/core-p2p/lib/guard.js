'use strict'

const moment = require('moment')
const semver = require('semver')
const container = require('@phantomcore/core-container')
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
    this.config = monitor.config.peers

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
    if (this.config.whiteList && this.config.whiteList.includes(peer.ip)) {
      return
    }

    const until = moment().add(this.monitor.manager.config.suspendMinutes, 'minutes')

    this.suspensions[peer.ip] = {
      peer,
      until,
      untilHuman: until.format('h [hrs], m [min]')
    }

    delete this.monitor.peers[peer.ip]

    logger.debug(`Suspended ${peer.ip} for ` + this.get(peer.ip).untilHuman)
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
    return this.config.whiteList.includes(peer.ip)
  }

  /**
   * Determine if the peer is blacklisted.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isBlacklisted (peer) {
    return this.config.blackList.includes(peer.ip)
  }

  /**
   * Determine if the peer is within the version constraints.
   * @param  {Peer}  peer
   * @return {Boolean}
   */
  isValidVersion (peer) {
    return semver.satisfies(peer.version, this.config.minimumVersion)
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
}

module.exports = new Guard()
