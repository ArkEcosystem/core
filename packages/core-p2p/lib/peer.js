'use strict'

const axios = require('axios')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')

module.exports = class Peer {
  /**
   * @constructor
   * @param  {String} ip
   * @param  {Number} port
   */
  constructor (ip, port) {
    this.ip = ip
    this.port = port
    this.ban = new Date().getTime()
    this.url = (port % 443 === 0 ? 'https://' : 'http://') + `${ip}:${port}`
    this.state = {}

    this.headers = {
      version: container.resolveOptions('blockchain').version,
      port: container.resolveOptions('p2p').port,
      nethash: config.network.nethash
    }
  }

  /**
   * Get information to broadcast.
   * @return {Object}
   */
  toBroadcastInfo () {
    return {
      ip: this.ip,
      port: this.port,
      version: this.version,
      os: this.os,
      status: this.status,
      height: this.state.height,
      delay: this.delay
    }
  }

  /**
   * Perform POST request for a block.
   * @param  {Block}              block
   * @return {(Object|undefined)}
   */
  async postBlock (block) {
    try {
      const response = await axios.post(`${this.url}/peer/blocks`, { block }, {
        headers: this.headers,
        timeout: 5000
      })

      this.__parseHeaders(response)

      return response.data
    } catch (error) {
      // logger.debug('Peer unresponsive', this.url + '/peer/blocks/', error.code)

      this.status = error.code
    }
  }

  /**
   * Perform POST request for a transactions.
   * @param  {Transaction[]}      transactions
   * @return {(Object|undefined)}
   */
  async postTransactions (transactions) {
    try {
      const response = await axios.post(`${this.url}/peer/transactions`, {
        transactions,
        isBroadCasted: true
      }, {
        headers: this.headers,
        timeout: 8000
      })

      this.__parseHeaders(response)

      return response.data
    } catch (error) {
      this.status = error.code
    }
  }

  async getTransactionsFromIds (ids) {
    // useless since there is a bug on v1
    const response = await this.__get(`/peer/transactionsFromIds?ids=${ids.join(',')}`)

    return response.success ? response.transactions : []
  }

  async getTransactionsFromBlock (blockId) {
    const response = await this.__get(`/api/transactions?blockId=${blockId}`)

    return response.success ? response.transactions : []
  }

  /**
   * Download blocks from peer.
   * @param  {Number} fromBlockHeight
   * @return {(Object[]|undefined)}
   */
  async downloadBlocks (fromBlockHeight) {
    try {
      const { data } = await axios.get(`${this.url}/peer/blocks`, {
        params: { lastBlockHeight: fromBlockHeight },
        headers: this.headers,
        timeout: 60000
      })

      const size = data.blocks.length

      if (size === 100 || size === 400) {
        this.downloadSize = size
      }

      return data.blocks
    } catch (error) {
      logger.debug(`Cannot download blocks from peer ${this.url} - ${JSON.stringify(error)}`)

      this.ban = new Date().getTime() + (Math.floor(Math.random() * 40) + 20) * 60000

      throw error
    }
  }

  /**
   * Perform ping request on peer.
   * @param  {Number} [delay=5000]
   * @return {Object}
   * @throws {Error} If fail to get peer status.
   */
  async ping (delay) {
    const body = await this.__get('/peer/status', delay || config.peers.globalTimeout)

    if (body) {
      this.state = body

      return body
    }

    throw new Error(`Peer ${this.ip} is unresponsive`)
  }

  /**
   * Refresh peer list. It removes blacklisted peers from the fetch
   * @return {Object[]}
   */
  async getPeers () {
    logger.info(`Fetching a fresh peer list from ${this.url}`)

    await this.ping(2000)

    const body = await this.__get('/peer/list')

    return body.peers.filter(peer => !config.peers.blackList.includes(peer.ip))
  }

  /**
   * Check if peer has common blocks.
   * @param  {[]String} ids
   * @return {Boolean}
   */
  async hasCommonBlocks (ids) {
    try {
      let url = `/peer/blocks/common?ids=${ids.join(',')}`
      if (ids.length === 1) {
        url += ','
      }
      const body = await this.__get(url)

      return body && body.success && body.common
    } catch (error) {
      logger.error(`Could not determine common blocks with ${this.ip}: ${error}`)
    }

    return false
  }

  /**
   * Perform GET request.
   * @param  {String} endpoint
   * @param  {Number} [timeout=10000]
   * @return {(Object|undefined)}
   */
  async __get (endpoint, timeout) {
    const temp = new Date().getTime()

    try {
      const response = await axios.get(`${this.url}${endpoint}`, {
        headers: this.headers,
        timeout: timeout || config.peers.globalTimeout
      })

      this.delay = new Date().getTime() - temp

      this.__parseHeaders(response)

      return response.data
    } catch (error) {
      this.status = error.code
    }
  }

  /**
   * Parse headers from response.
   * @param  {Object} response
   * @return {Object}
   */
  __parseHeaders (response) {
    ;['nethash', 'os', 'version'].forEach(key => (this[key] = response.headers[key]))

    this.status = 'OK'

    return response
  }
}
