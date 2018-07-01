'use strict'

const axios = require('axios')
const sample = require('lodash/sample')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')

module.exports = class Client {
  /**
   * Create a new client instance.
   * @param  {Array} hosts
   */
  constructor (hosts) {
    this.hosts = hosts

    this.headers = {
      version: container.resolveOptions('blockchain').version,
      port: container.resolveOptions('p2p').port,
      nethash: config.network.nethash
    }
  }

  /**
   * Send the given block to the relay.
   * @param  {Object} block
   * @return {Object}
   */
  async broadcast (block) {
    await this.__chooseHost()

    logger.info(`Sending forged block ${block.id} at height ${block.height.toLocaleString()} with ${block.numberOfTransactions} transactions to ${this.host} :package:`)

    const response = await axios.post(`${this.host}/internal/block`, block, {
      headers: this.headers,
      timeout: 2000
    })

    return response.data.success
  }

  /**
   * Get the current round.
   * @return {Object}
   */
  async getRound () {
    await this.__chooseHost()

    const response = await axios.get(`${this.host}/internal/round`, {
      headers: this.headers,
      timeout: 2000
    })

    return response.data.round
  }

  /**
   * Get the current network quorum.
   * @return {Object}
   */
  async getNetworkState () {
    await this.__chooseHost()

    const response = await axios.get(`${this.host}/internal/networkState`, {
      headers: this.headers,
      timeout: 2000
    })

    return response.data
  }

  /**
   * Get all transactions that are ready to be forged.
   * @return {Object}
   */
  async getTransactions () {
    await this.__chooseHost()

    const response = await axios.get(`${this.host}/internal/forgingTransactions`, {
      headers: this.headers,
      timeout: 2000
    })

    return response.data.data || {}
  }

  /**
   * Chose a responsive host.
   * @return {void}
   */
  async __chooseHost () {
    const host = sample(this.hosts)

    try {
      await axios.get(`${host}/peer/status`, {
        headers: this.headers,
        timeout: 2000
      })

      this.host = host
    } catch (error) {
      logger.debug(`${host} didn't respond to the forger. Trying another host :sparkler:`)

      await this.__chooseHost()
    }
  }
}
