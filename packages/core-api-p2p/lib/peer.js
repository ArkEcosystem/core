'use strict';

const popsicle = require('popsicle')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const threads = require('threads')
const thread = threads.spawn(`${__dirname}/download-worker.js`)

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class Peer {
  /**
   * [constructor description]
   * @param  {[type]} ip     [description]
   * @param  {[type]} port   [description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
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
   * [toBroadcastInfo description]
   * @return {[type]} [description]
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
   * [get description]
   * @param  {[type]} api     [description]
   * @param  {[type]} timeout [description]
   * @return {[type]}         [description]
   */
  async get (api, timeout) {
    const temp = new Date().getTime()
    const that = this

    try {
      const res = await popsicle.request({
        method: 'GET',
        url: this.url + api,
        headers: this.headers,
        timeout: timeout || 10000
      }).use(popsicle.plugins.parse('json'))

      that.delay = new Date().getTime() - temp

      this.parseHeaders(res)

      return res.body
    } catch (error) {
      // logger.error(error.stack)

      this.status = error.code
    }
  }

  /**
   * [postBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
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
   * [parseHeaders description]
   * @param  {[type]} res [description]
   * @return {[type]}     [description]
   */
  parseHeaders (res) {
    ['nethash', 'os', 'version'].forEach(key => (this[key] = res.headers[key]))
    this.status = 'OK'

    return res
  }

  /**
   * [downloadBlocks description]
   * @param  {[type]} fromBlockHeight [description]
   * @return {[type]}                 [description]
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
      logger.debug(`Cannot Download blocks from peer - ${error}`)

      this.ban = new Date().getTime() + 60 * 60000
    }
  }

  /**
   * [ping description]
   * @param  {[type]} delay [description]
   * @return {[type]}       [description]
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
   * [getPeers description]
   * @return {[type]} [description]
   */
  async getPeers () {
    logger.info(`Getting fresh peer list from ${this.url}`)
    await this.ping(5000)
    const body = await this.get('/peer/list')

    return body.peers
  }
}
