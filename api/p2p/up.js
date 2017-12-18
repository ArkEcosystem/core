const restify = require('restify')
const logger = require('../../core/logger')
const dbInterface = require('../../core/dbinterface')
const blockchain = require('../../core/blockchainManager')
const arkjs = require('arkjs')
const crypto = require('crypto')

const _headers = {
  os: require('os').platform()
}

function setHeaders (res) {
  ;['nethash', 'os', 'version', 'port'].forEach(key => res.header(key, _headers[key]))
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
    this.mountV1(server)

    server.listen(this.port, () => logger.info('%s interface listening at %s', server.name, server.url))
  }

  mountV1 (server) {
    server.get('/peer/list', (req, res, next) => this.getPeers(req, res, next))
    // server.get('/peer/blocks/common', this.getCommonBlocks);
    server.get('/peer/blocks', (req, res, next) => this.getBlocks(req, res, next))
    // server.get('/peer/transactions', this.getTransactions);
    // server.get('/peer/transactionsFromIds', this.getTransactionsFromIds);
    server.get('/peer/height', (req, res, next) => this.getHeight(req, res, next))
    server.get('/peer/status', (req, res, next) => this.getStatus(req, res, next))

    server.post('/blocks', this.postInternalBlock) // Currently the `internal` behaviour is the same
    // server.post('/transactions', this.postTransactions);
  }

  mountInternal (server) {
    server.get('/internal/round', (req, res, next) => this.getRound(req, res, next))
    server.post('/internal/block', (req, res, next) => this.postInternalBlock(req, res, next))
  }

  isLocalhost (request) {
    const ip = request.connection.remoteAddress
    return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1'
  }

  acceptRequest (req, res, next) {
    if (req.route.path.startsWith('/internal/') && !this.isLocalhost(req)) {
      this.fail(res, `API endpoint does not exist: ${req.route.path}`)
    }

    const peer = {
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
    // FIXME when mixing IPv6 and IPv4
    if (peer.ip === '::ffff:127.0.0.1') {
      peer.ip = '127.0.0.1'
    }
    ;['port', 'nethash', 'os', 'version'].forEach(key => peer[key] = req.headers[key])

    this.p2p
      .acceptNewPeer(peer)
      .then(() => {
        setHeaders(res)
        next()
      })
      .catch(error => this.fail(res, error))
  }

  success(res, next, data={}) {
    data.success = true
    res.send(200, data)
    next()
  }

  fail(res, error) {
    logger.error(error)
    res.send(500, {success: false, message: error})
  }

  getPeers (req, res, next) {
    this.p2p
      .getPeers()
      .then(peers => {
        const randomPeers = peers
          .map(peer => peer.toBroadcastInfo())
          .sort(() => Math.random() - 0.5)
        this.success(res, next, { peers: randomPeers})
      })
      .catch(error => this.fail(res, error))
  }

  getHeight (req, res, next) {
    this.success(res, next, {
      height: blockchain.getInstance().lastBlock.data.height,
      id: blockchain.getInstance().lastBlock.data.id
    })
  }

  getStatus (req, res, next) {
    const { lastBlock } = blockchain.getInstance()

    // TODO comment to explain "slot"
    const { slots } = arkjs
    const forgingAllowed = slots.getSlotNumber() === slots.getSlotNumber(slots.getTime() + slots.interval / 2)

    const header = lastBlock.getHeader()
    // Avoid converting a circular structure to JSON
    // TODO remove the metadata + "private" (_xxx) attributes
    delete header._modelOptions

    this.success(res, next, {
      height: lastBlock.data.height,
      forgingAllowed,
      currentSlot: slots.getSlotNumber(),
      header
    })
  }

  getRound (req, res, next) {
    const { lastBlock } = blockchain.getInstance()
    const maxActive = this.config.getConstants(lastBlock.data.height).activeDelegates
    const { blockTime } = this.config.getConstants(lastBlock.data.height)
    const { reward } = this.config.getConstants(lastBlock.data.height)

    this.getActiveDelegates(lastBlock.data.height).then(delegates => {
      this.success(res, next, {
        round: {
          current: parseInt(lastBlock.data.height / maxActive),
          reward,
          timestamp: arkjs.slots.getTime(),
          delegates,
          delegate: delegates[lastBlock.data.height % maxActive],
          lastBlock: lastBlock.data,
          canForge: parseInt(lastBlock.data.timestamp / blockTime) < parseInt(arkjs.slots.getTime() / blockTime)
        }
      })
    }).catch(error => this.fail(res, error))
  }

  postInternalBlock (req, res, next) {
    blockchain.getInstance().postBlock(req.body)
    this.success(res, next)
  }

  getActiveDelegates (height) {
    const round = parseInt(height / this.config.getConstants(height).activeDelegates)
    const seedSource = round.toString()
    let currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest()
    return dbInterface.getInstance().getActiveDelegates(height)
      .then(activedelegates => {
        for (let i = 0, delCount = activedelegates.length; i < delCount; i++) {
          for (let x = 0; x < 4 && i < delCount; i++, x++) {
            const newIndex = currentSeed[x] % delCount
            const b = activedelegates[newIndex]
            activedelegates[newIndex] = activedelegates[i]
            activedelegates[i] = b
          }
          currentSeed = crypto.createHash('sha256').update(currentSeed).digest()
        }
        return Promise.resolve(activedelegates)
      })
  }

  getBlocks (req, res, next) {
    // TODO should lastBlock query param be mandatory?
    const height = (req.query.lastBlockHeight ? parseInt(req.query.lastBlockHeight) : 0) + 1

    dbInterface.getInstance().getBlocks(height, 400)
      .then(blocks => this.success(res, next, { blocks }))
      .catch(error => this.fail(res, error))
  }
}

module.exports = Up
