'use strict'
const axios = require('axios')
const sample = require('lodash/sample')
const delay = require('delay')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')

module.exports = class Client {
  /**
   * Create a new client instance.
   * @param  {(Array|String)} hosts - Host or Array of hosts
   */
  constructor (hosts) {
    this.hosts = Array.isArray(hosts) ? hosts : [hosts]

    this.headers = {
      version: container.resolveOptions('blockchain').version,
      port: container.resolveOptions('p2p').port,
      nethash: config.network.nethash
    }
  }

  /**
   * Send the given block to the relay.
   * @param  {(Block|Object)} block
   * @return {Object}
   */
  async broadcast (block) {
    logger.debug(`Broadcasting forged block id:${block.id} at height:${block.height.toLocaleString()} with ${block.numberOfTransactions} transactions to ${this.host} :package:`)

    return this.__post(`${this.host}/internal/blocks`, { block })
  }

  /**
   * Sends the WAKEUP signal to the to relay hosts to check if synced and sync if necesarry
   */
  async syncCheck () {
    await this.__chooseHost()

    logger.debug(`Sending wake-up check to relay node ${this.host}`)

    try {
      await this.__get(`${this.host}/internal/blockchain/sync`)
    } catch (error) {
      logger.error(`Could not sync check: ${error.message}`)
    }
  }

  /**
   * Get the current round.
   * @return {Object}
   */
  async getRound () {
    await this.__chooseHost()

    const response = await this.__get(`${this.host}/internal/rounds/current`)

    return response.data.data
  }

  /**
   * Get the current network quorum.
   * @return {Object}
   */
  async getNetworkState () {
    try {
      const response = await this.__get(`${this.host}/internal/network/state`)

      return response.data.data
    } catch (e) {
      return {}
    }
  }

  /**
   * Get all transactions that are ready to be forged.
   * @return {Object}
   */
  async getTransactions () {
    try {
      const response = await this.__get(`${this.host}/internal/transactions/forging`)

      return response.data.data
    } catch (e) {
      return {}
    }
  }

  /**
   * Get a list of all active delegate usernames.
   * @return {Object}
   */
  async getUsernames (wait = 0) {
    await this.__chooseHost(wait)

    try {
      const response = await this.__get(`${this.host}/internal/utils/usernames`)

      return response.data.data
    } catch (e) {
      return {}
    }
  }

  /**
   * Emit the given event and payload to the local host.
   * @param  {String} event
   * @param  {Object} body
   * @return {Object}
   */
  async emitEvent (event, body) {
    // NOTE: Events need to be emitted to the localhost. If you need to trigger
    // actions on a remote host based on events you should be using webhooks
    // that get triggered by the events you wish to react to.

    const allowedHosts = ['localhost', '127.0.0.1', '::ffff:127.0.0.1', '192.168.*']

    const host = this.hosts.find(host => {
      return allowedHosts.some(allowedHost => host.includes(allowedHost))
    })

    if (!host) {
      return logger.error('Was unable to find any local hosts.')
    }

    try {
      await this.__post(`${host}/internal/utils/events`, { event, body })
    } catch (error) {
      logger.error(`Failed to emit "${event}" to "${host}"`)
    }
  }

  /**
   * Chose a responsive host.
   * @return {void}
   */
  async __chooseHost (wait = 0) {
    const host = sample(this.hosts)

    try {
      await this.__get(`${host}/peer/status`)

      this.host = host
    } catch (error) {
      logger.debug(`${host} didn't respond to the forger. Trying another host :sparkler:`)

      if (wait > 0) {
        await delay(wait)
      }

      await this.__chooseHost(wait)
    }
  }

  async __get (url) {
    return axios.get(url, { headers: this.headers, timeout: 2000 })
  }

  async __post (url, body) {
    return axios.post(url, body, { headers: this.headers, timeout: 2000 })
  }
}
