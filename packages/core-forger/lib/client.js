'use strict'

const popsicle = require('popsicle')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')

module.exports = class ForgerManager {
  /**
   * Create a new forger manager instance.
   * @param  {String} host
   */
  constructor (host) {
    this.host = `${host}:${config.server.port}`

    this.headers = {
      version: config.server.version,
      port: config.server.port,
      nethash: config.network.nethash
    }
  }

  /**
   * Send the given block to the relay.
   * @param  {Object} block
   * @return {Object}
   */
  async broadcast (block) {
    logger.info(`Sending forged block ${block.id} at height ${block.height} with ${block.numberOfTransactions} transactions to relay node`)

    const response = await popsicle.request({
      method: 'POST',
      url: this.host + '/internal/block',
      body: block,
      headers: this.headers,
      timeout: 2000
    }).use(popsicle.plugins.parse('json'))

    return response.body.success
  }

  /**
   * Get the current round.
   * @return {Object}
   */
  async getRound () {
    const response = await popsicle.request({
      method: 'GET',
      url: this.host + '/internal/round',
      headers: this.headers,
      timeout: 2000
    }).use(popsicle.plugins.parse('json'))

    return response.body.round
  }

  /**
   * Get all transactions that are ready to be forged.
   * @return {Object}
   */
  async getTransactions () {
    const response = await popsicle.request({
      method: 'GET',
      url: this.host + '/internal/forgingTransactions',
      headers: this.headers,
      timeout: 2000
    }).use(popsicle.plugins.parse('json'))

    return response.body.data || {}
  }
}
