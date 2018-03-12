const popsicle = require('popsicle')
const logger = require('app/core/logger')
const threads = require('threads')
const thread = threads.spawn(`${__dirname}/download-worker.js`)

module.exports = class Peer {
  constructor (ip, port, config) {
    this.ip = ip
    this.port = port
    this.ban = new Date().getTime()
    this.url = (port % 443 === 0 ? 'https://' : 'http://') + `${ip}:${port}`
    this.headers = {
      version: config.server.version,
      port: config.server.port,
      nethash: config.network.nethash
    }
  }

  toBroadcastInfo () {
    return {
      ip: this.ip,
      port: this.port,
      version: this.version,
      os: this.os,
      status: this.status,
      height: this.height,
      delay: this.delay
    }
  }

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

  async postBlock (block) {
    try {
      const res = await popsicle.request({
        method: 'POST',
        url: this.url + '/peer/block',
        data: block,
        headers: this.headers,
        timeout: 5000
      }).use(popsicle.plugins.parse('json'))

      this.parseHeaders(res)

      return res.body
    } catch (error) {
      logger.debug('Peer unreachable', this.url + '/peer/block/', error.code)

      this.status = error.code
    }
  }

  parseHeaders (res) {
    ['nethash', 'os', 'version', 'height'].forEach(key => (this[key] = res.headers[key]))
    this.status = 'OK'

    return res
  }

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

  async ping (delay) {
    const body = await this.get('/peer/status', delay || 5000)

    if (body) {
      return (this.height = body.height)
    }

    throw new Error('Peer unreachable')
  }

  async getPeers () {
    await this.ping(2000)
    const body = await this.get('/peer/list')

    return body.peers
  }
}
