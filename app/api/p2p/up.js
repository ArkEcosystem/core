const restify = require('restify')
const arkjs = require('arkjs')
const crypto = require('crypto')
const requestIp = require('request-ip')
const goofy = require('app/core/goofy')
const blockchain = require('app/core/managers/blockchain')
const Transaction = require('app/models/transaction')

const _headers = {
  os: require('os').platform()
}

function setHeaders (res) {
  ['nethash', 'os', 'version', 'port'].forEach((key) => res.header(key, _headers[key]))
}

class Up {
  constructor (config) {
    this.port = config.server.port
    this.config = config
    _headers.version = config.server.version
    _headers.port = config.server.port
    _headers.nethash = config.network.nethash
  }

  start (p2p) {
    this.p2p = p2p
    let server = restify.createServer({name: 'arkp2p'})
    server.use((req, res, next) => this.acceptRequest(req, res, next))
    server.use(restify.plugins.bodyParser({mapParams: true}))
    server.use(restify.plugins.queryParser())
    server.use(restify.plugins.gzipResponse())

    this.mountInternal(server)
    if (this.config.api.p2p.remoteinterface) this.mountRemoteInterface(server)
    this.mountV1(server)

    server.listen(this.port, () => goofy.info('%s interface listening at %s', server.name, server.url))
  }

  isLocalhost (req) {
    return req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1' || req.connection.remoteAddress === '::ffff:127.0.0.1'
  }

  async acceptRequest (req, res, next) {
    if ((req.route.path.startsWith('/internal/') || req.route.path.startsWith('/remote/')) && !this.isLocalhost(req)) {
      res.send(500, {
        code: 'ResourceNotFound',
        message: `${req.route.path} does not exist`
      })
    }
    if (req.route.path.startsWith('/peer/')) {
      const peer = {}
      peer.ip = requestIp.getClientIp(req);
      ['port', 'nethash', 'os', 'version'].forEach(key => (peer[key] = req.headers[key]))

      try {
        await this.p2p.acceptNewPeer(peer)
        await setHeaders(res)

        return next()
      } catch (error) {
        res.send(500, {success: false, message: error})
      }
    }

    return next()
  }

  async getActiveDelegates (height) {
    const round = parseInt(height / this.config.getConstants(height).activeDelegates)
    const seedSource = round.toString()
    let currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest()

    const activedelegates = await blockchain.getInstance().getDb().getActiveDelegates(height)

    for (let i = 0, delCount = activedelegates.length; i < delCount; i++) {
      for (let x = 0; x < 4 && i < delCount; i++, x++) {
        const newIndex = currentSeed[x] % delCount
        const b = activedelegates[newIndex]
        activedelegates[newIndex] = activedelegates[i]
        activedelegates[i] = b
      }
      currentSeed = crypto.createHash('sha256').update(currentSeed).digest()
    }

    return activedelegates
  }
}

module.exports = Up
