const popsicle = require('popsicle')
const goofy = require('app/core/goofy')
const PromiseWorker = require('app/core/promise-worker')
const Worker = require('tiny-worker')
const worker = new Worker(`${__dirname}/download-worker.js`)
const promiseWorker = new PromiseWorker(worker)

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
      // goofy.error(error)

      this.status = error.code
    }
  }

  async postBlock (block) {
    try {
      const res = await popsicle.request({
        method: 'POST',
        url: this.url + '/peer/block/',
        data: block,
        headers: this.headers,
        timeout: 2000
      }).use(popsicle.plugins.parse('json'))

      this.parseHeaders(res)

      return res.body
    } catch (error) {
      goofy.error(error)

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
    const that = this

    try {
      const response = await promiseWorker.postMessage(message)

      const size = response.body.blocks.length

      if (size === 100 || size === 400) {
        that.downloadSize = size
      }

      return response.body.blocks
    } catch (error) {
      goofy.debug('Cannot Download blocks from peer', error)

      that.ban = new Date().getTime() + 60 * 60000
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
