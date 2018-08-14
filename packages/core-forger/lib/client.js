'use strict'
const Promise = require('bluebird')
const axios = require('axios')
const sample = require('lodash/sample')
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
    await this.__chooseHost()

    logger.info(`INTERNAL: Sending forged block ${block.id} at height ${block.height.toLocaleString()} with ${block.numberOfTransactions} transactions to ${this.host} :package:`)

    const response = await axios.post(`${this.host}/internal/block`, block, {
      headers: this.headers,
      timeout: 2000
    })

    return response.data.success
  }

  /**
   * Sends the WAKEUP signal to the to relay hosts to check if synced and sync if necesarry
   */
  async syncCheck () {
    await Promise.each(this.hosts, async (host) => {
      logger.debug(`Sending wake-up check to relay node(s) ${host}`)
      await this.__get(`${this.host}/internal/syncCheck`)
    })
  }

  /**
   * Get the current round.
   * @return {Object}
   */
  async getRound () {
    await this.__chooseHost()

    const response = await this.__get(`${this.host}/internal/round`)

    return response.data.round
  }

  /**
   * Get the current network quorum.
   * @return {Object}
   */
  async getNetworkState () {
    await this.__chooseHost()

    const response = await this.__get(`${this.host}/internal/networkState`)

    return response.data.networkState
  }

  /**
   * Get all transactions that are ready to be forged.
   * @return {Object}
   */
  async getTransactions () {
    await this.__chooseHost()

    const response = await this.__get(`${this.host}/internal/forgingTransactions`)

    return response.data.data || {}
  }

  /**
   * Get a list of all active delegate usernames.
   * @return {Object}
   */
  async getUsernames () {
    await this.__chooseHost()

    const response = await this.__get(`${this.host}/internal/usernames`)

    return response.data.data || {}
  }

  /**
   * Chose a responsive host.
   * @return {void}
   */
  async __chooseHost () {
    const host = sample(this.hosts)

    try {
      await this.__get(`${host}/peer/status`)

      this.host = host
    } catch (error) {
      logger.debug(`${host} didn't respond to the forger. Trying another host :sparkler:`)

      await this.__chooseHost()
    }
  }

  async __get (url) {
    return axios.get(url, { headers: this.headers, timeout: 2000 })
  }
}
