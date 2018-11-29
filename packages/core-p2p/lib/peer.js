const axios = require('axios')
const chunk = require('lodash/chunk')
const util = require('util')
const dayjs = require('dayjs-ext')
const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')
const config = app.resolvePlugin('config')

module.exports = class Peer {
  /**
   * @constructor
   * @param  {String} ip
   * @param  {Number} port
   */
  constructor(ip, port) {
    this.ip = ip
    this.port = port
    this.ban = new Date().getTime()
    this.url = `${port % 443 === 0 ? 'https://' : 'http://'}${ip}:${port}`
    this.state = {}
    this.offences = []
    this.lastPinged = null

    this.headers = {
      version: app.getVersion(),
      port: app.resolveOptions('p2p').port,
      nethash: config.network.nethash,
      height: null,
      'Content-Type': 'application/json',
    }

    if (config.network.name !== 'mainnet') {
      this.headers.hashid = app.getHashid()
    }
  }

  /**
   * Set the given headers for the peer.
   * @param  {Object} headers
   * @return {void}
   */
  setHeaders(headers) {
    ;['nethash', 'os', 'version'].forEach(key => {
      this[key] = headers[key]
    })
  }

  /**
   * Get information to broadcast.
   * @return {Object}
   */
  toBroadcastInfo() {
    const data = {
      ip: this.ip,
      port: +this.port,
      nethash: this.nethash,
      version: this.version,
      os: this.os,
      status: this.status,
      height: this.state.height,
      delay: this.delay,
    }

    if (config.network.name !== 'mainnet') {
      data.hashid = this.hashid || 'unknown'
    }

    return data
  }

  static isOk(peer) {
    return peer.status === 200 || peer.status === 'OK'
  }

  /**
   * Perform POST request for a block.
   * @param  {Block}              block
   * @return {(Object|undefined)}
   */
  async postBlock(block) {
    return this.__post(
      '/peer/blocks',
      { block },
      {
        headers: this.headers,
        timeout: 5000,
      },
    )
  }

  /**
   * Perform POST request for a transactions.
   * @param  {Transaction[]}      transactions
   * @return {(Object|undefined)}
   */
  async postTransactions(transactions) {
    try {
      const response = await this.__post(
        '/peer/transactions',
        {
          transactions,
        },
        {
          headers: this.headers,
          timeout: 8000,
        },
      )

      return response
    } catch (err) {
      throw err
    }
  }

  async getTransactionsFromIds(ids) {
    // useless since there is a bug on v1
    const response = await this.__get(
      `/peer/transactionsFromIds?ids=${ids.join(',')}`,
    )

    return response.success ? response.transactions : []
  }

  async getTransactionsFromBlock(blockId) {
    const response = await this.__get(`/api/transactions?blockId=${blockId}`)

    return response.success ? response.transactions : []
  }

  /**
   * Download blocks from peer.
   * @param  {Number} fromBlockHeight
   * @return {(Object[]|undefined)}
   */
  async downloadBlocks(fromBlockHeight) {
    try {
      const response = await axios.get(`${this.url}/peer/blocks`, {
        params: { lastBlockHeight: fromBlockHeight },
        headers: this.headers,
        timeout: 10000,
      })

      this.__parseHeaders(response)

      const { blocks } = response.data
      const size = blocks.length

      if (size === 100 || size === 400) {
        this.downloadSize = size
      }

      return blocks
    } catch (error) {
      logger.debug(
        `Cannot download blocks from peer ${this.url} - ${util.inspect(error, {
          depth: 1,
        })}`,
      )

      this.ban =
        new Date().getTime() + (Math.floor(Math.random() * 40) + 20) * 60000

      throw error
    }
  }

  /**
   * Perform ping request on this peer if it has not been
   * recently pinged.
   * @param  {Number} [delay=5000]
   * @param  {Boolean} force
   * @return {Object}
   * @throws {Error} If fail to get peer status.
   */
  async ping(delay, force = false) {
    if (this.recentlyPinged() && !force) {
      return
    }

    const body = await this.__get(
      '/peer/status',
      delay || config.peers.globalTimeout,
    )

    if (!body) {
      throw new Error(`Peer ${this.ip} is unresponsive`)
    }

    this.lastPinged = dayjs()
    this.state = body
    return body
  }

  /**
   * Returns true if this peer was pinged the past 2 minutes.
   * @return {Boolean}
   */
  recentlyPinged() {
    return !!this.lastPinged && dayjs().diff(this.lastPinged, 'm') < 2
  }

  /**
   * Refresh peer list. It removes blacklisted peers from the fetch
   * @return {Object[]}
   */
  async getPeers() {
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
  async hasCommonBlocks(ids) {
    try {
      let url = `/peer/blocks/common?ids=${ids.join(',')}`
      if (ids.length === 1) {
        url += ','
      }
      const body = await this.__get(url)

      return body && body.success && body.common
    } catch (error) {
      logger.error(
        `Could not determine common blocks with ${this.ip}: ${error}`,
      )
    }

    return false
  }

  /**
   * Perform GET request.
   * @param  {String} endpoint
   * @param  {Number} [timeout=10000]
   * @return {(Object|undefined)}
   */
  async __get(endpoint, timeout) {
    const temp = new Date().getTime()

    try {
      const response = await axios.get(`${this.url}${endpoint}`, {
        headers: this.headers,
        timeout: timeout || config.peers.globalTimeout,
      })

      this.delay = new Date().getTime() - temp

      this.__parseHeaders(response)

      return response.data
    } catch (error) {
      this.delay = -1

      logger.debug(
        `Request to ${this.url}${endpoint} failed because of "${
          error.message
        }"`,
      )

      if (error.response) {
        this.__parseHeaders(error.response)
      }
    }
  }

  /**
   * Perform POST request.
   * @param  {String} endpoint
   * @param  {Object} body
   * @param  {Object} headers
   * @return {(Object|undefined)}
   */
  async __post(endpoint, body, headers) {
    try {
      const response = await axios.post(`${this.url}${endpoint}`, body, headers)

      this.__parseHeaders(response)

      return response.data
    } catch (error) {
      logger.debug(
        `Request to ${this.url}${endpoint} failed because of "${
          error.message
        }"`,
      )

      if (error.response) {
        this.__parseHeaders(error.response)
      }
    }
  }

  /**
   * Parse headers from response.
   * @param  {Object} response
   * @return {Object}
   */
  __parseHeaders(response) {
    ;['nethash', 'os', 'version', 'hashid'].forEach(key => {
      this[key] = response.headers[key] || this[key]
    })

    if (response.headers.height) {
      this.state.height = +response.headers.height
    }

    this.status = response.status

    return response
  }
}
