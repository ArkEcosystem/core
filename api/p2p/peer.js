const popsicle = require('popsicle')
const logger = requireFrom('core/logger')
const PromiseWorker = require('promise-worker')
const Worker = require('tiny-worker')
const worker = new Worker(`${__dirname}/downloadWorker.js`)
const promiseWorker = new PromiseWorker(worker)

class Peer {
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

  get (apiPath, timeout) {
    const startTime = new Date().getTime()
    return new Promise((resolve, reject) => {
      popsicle
        .get(`${this.url}${apiPath}`, {
          headers: this.headers,
          timeout: timeout || 10000
        })
        .use(popsicle.plugins.parse('json'))
        .then(response => {
          this.parseHeaders(response.headers)
          this.status = 'OK'
          this.delay = new Date().getTime() - startTime
          resolve(response.body)
        })
        .catch(error => {
          this.status = error.code
          reject(error)
        })
    })
  }

  parseHeaders (headers) {
    ;['nethash', 'os', 'version', 'height'].forEach(key => this[key] = headers[key])
  }

  downloadBlocks (fromBlockHeight) {
    const message = {
      height: fromBlockHeight,
      headers: this.headers,
      url: this.url
    }
    const that = this
    return promiseWorker
      .postMessage(message)
      .then(response => {
        const size = response.body.blocks.length
        if (size === 100 || size === 400) that.downloadSize = size
        return Promise.resolve(response.body.blocks)
      }).catch(error => {
        logger.debug('Cannot Download blocks from peer', error)
        that.ban = new Date().getTime() + 60 * 60000
      })
  }

  ping () {
    return this
      .get('/peer/status', 2000)
      .then(body => this.height = (body || {}).height)
  }

  getPeers () {
    return this
      .get('/peer/list')
      .then(body => body.peers)
  }
}

module.exports = Peer
