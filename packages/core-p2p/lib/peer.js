'use strict'

const popsicle = require('popsicle')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')
const threads = require('threads')
const thread = threads.spawn(`${__dirname}/workers/download.js`)

module.exports = class Peer {
  /**
   * @constructor
   * @param  {String} ip
   * @param  {Number} port
   * @param  {Object} config
   */
  constructor (ip, port, config) {
    this.ip = ip
    this.port = port
    this.ban = new Date().getTime()
    this.url = (port % 443 === 0 ? 'https://' : 'http://') + `${ip}:${port}`
    this.state = {}
    this.headers = {
      version: config.server.version,
      port: config.server.port,
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
   * Perform GET request.
   * @param  {String} endpoint
   * @param  {Number} [timeout=10000]
   * @return {(Object|undefined)}
   */
  async get (endpoint, timeout) {
    const temp = new Date().getTime()

    try {
      const res = await popsicle.request({
        method: 'GET',
        url: this.url + endpoint,
        headers: this.headers,
        timeout: timeout || 10000
      }).use(popsicle.plugins.parse('json'))

      this.delay = new Date().getTime() - temp

      this.parseHeaders(res)

      return res.body
    } catch (error) {
      // logger.error(error.stack)

      this.status = error.code
    }
  }

  /**
   * Perform POST request for a block.
   * @param  {Block}              block
   * @return {(Object|undefined)}
   */
  async postBlock (block) {
    // console.log(block)
    // console.log(this)
    try {
      const res = await popsicle.request({
        method: 'POST',
        url: this.url + '/peer/blocks',
        body: {block},
        headers: this.headers,
        timeout: 5000
      }).use(popsicle.plugins.parse('json'))

      this.parseHeaders(res)
      // console.log(res.body)
      return res.body
    } catch (error) {
      // logger.debug('Peer unreachable', this.url + '/peer/blocks/', error.code)

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
      const res = await popsicle.request({
        method: 'POST',
        url: this.url + '/peer/transactions',
        body: {
          transactions,
          broadcast: true
        },
        headers: this.headers,
        timeout: 5000
      }).use(popsicle.plugins.parse('json'))

      this.parseHeaders(res)

      return res.body
    } catch (error) {
      this.status = error.code
    }
  }

  /**
   * Parse headers from response.
   * @param  {Object} res
   * @return {Object}
   */
  parseHeaders (res) {
    ['nethash', 'os', 'version'].forEach(key => (this[key] = res.headers[key]))
    this.status = 'OK'

    return res
  }

  /**
   * Download blocks from peer.
   * @param  {Number}               fromBlockHeight
   * @return {(Object[]|undefined)}
   */
  async downloadBlocks (fromBlockHeight) {
    const message = {
      height: fromBlockHeight,
      headers: this.headers,
      url: this.url
    }

    try {
      const response = await thread.send(message).promise()

      const size = response.body.blocks.length

      if (size === 100 || size === 400) {
        this.downloadSize = size
      }

      return response.body.blocks
    } catch (error) {
      logger.debug(`Cannot download blocks from peer ${this.url} - ${JSON.stringify(error)}`)
      this.ban = new Date().getTime() + 60 * 60000
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
    const body = await this.get('/peer/status', delay || 5000)

    if (body) {
      this.state = body

      return body
    }

    throw new Error('Peer unreachable')
  }

  /**
   * Refresh peer list.
   * @return {Object[]}
   */
  async getPeers () {
    logger.info(`Fetching a fresh peer list from ${this.url}`)

    await this.ping(5000)

    const body = await this.get('/peer/list')

    return body.peers
  }
}
