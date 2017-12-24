const restify = require('restify')
const logger = require(__root + 'core/logger')
const db = require(__root + 'core/dbinterface').getInstance()
const blockchain = require(__root + 'core/blockchainManager')
const arkjs = require('arkjs')
const crypto = require('crypto')

const _headers = {
  os: require('os').platform()
}

function setHeaders (res) {
  ['nethash', 'os', 'version', 'port'].forEach((key) => res.header(key, _headers[key]))
  return Promise.resolve()
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

    server.post('/blocks', this.postBlock)
    // server.post('/transactions', this.postTransactions);
  }

  mountInternal (server) {
    server.get('/internal/round', (req, res, next) => this.getRound(req, res, next))
    server.post('/internal/block', (req, res, next) => this.postInternalBlock(req, res, next))
  }

  isLocalhost (req) {
    return req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1' || req.connection.remoteAddress === '::ffff:127.0.0.1'
  }

  acceptRequest (req, res, next) {
    if (req.route.path.startsWith('/internal/') && !this.isLocalhost(req)) {
      res.send(500, {success: false, message: 'API not existing'})
    }
    const peer = {}
    peer.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ['port', 'nethash', 'os', 'version'].forEach(key => (peer[key] = req.headers[key]))
    this.p2p
      .acceptNewPeer(peer)
      .then(() => setHeaders(res))
      .then(() => next())
      .catch(error => res.send(500, {success: false, message: error}))
  }

  getPeers (req, res, next) {
    this.p2p
      .getPeers()
      .then(peers => {
        const rpeers = peers
          .map(peer => peer.toBroadcastInfo())
          .sort(() => Math.random() - 0.5)
        res.send(200, {success: true, peers: rpeers})
        next()
      })
      .catch(error => res.send(500, {success: false, message: error}))
  }

  getHeight (req, res, next) {
    res.send(200, {
      success: true,
      height: blockchain.getInstance().lastBlock.data.height,
      id: blockchain.getInstance().lastBlock.data.id
    })
    next()
  }

  getStatus (req, res, next) {
    const lastBlock = blockchain.getInstance().lastBlock.getHeader()
    res.send(200, {
      success: true,
      height: lastBlock.height,
      forgingAllowed: arkjs.slots.getSlotNumber() === arkjs.slots.getSlotNumber(arkjs.slots.getTime() + arkjs.slots.interval / 2),
      currentSlot: arkjs.slots.getSlotNumber(),
      header: lastBlock
    })
    next()
  }

  getRound (req, res, next) {
    const lastBlock = blockchain.getInstance().lastBlock
    const maxActive = this.config.getConstants(lastBlock.data.height).activeDelegates
    const blockTime = this.config.getConstants(lastBlock.data.height).blocktime
    const reward = this.config.getConstants(lastBlock.data.height).reward
    this.getActiveDelegates(lastBlock.data.height).then(delegates => {
      res.send(200, {
        success: true,
        round: {
          current: parseInt(lastBlock.data.height / maxActive),
          reward: reward,
          timestamp: arkjs.slots.getTime(),
          delegates: delegates,
          delegate: delegates[lastBlock.data.height % maxActive],
          lastBlock: lastBlock.data,
          canForge: parseInt(lastBlock.data.timestamp / blockTime) < parseInt(arkjs.slots.getTime() / blockTime)
        }
      })
      next()
    }).catch(error => res.send(500, {success: false, message: error}))
  }

  postInternalBlock (req, res, next) {
    // console.log(req.body)
    blockchain.getInstance().postBlock(req.body)
    res.send(200, {
      success: true
    })
    next()
  }

  postBlock (req, res, next) {
    blockchain.getInstance().postBlock(req.body)
    res.send(200, {
      success: true
    })
    next()
  }

  getActiveDelegates (height) {
    const round = parseInt(height / this.config.getConstants(height).activeDelegates)
    const seedSource = round.toString()
    let currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest()
    return db.getActiveDelegates(height)
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
    db.getBlocks(parseInt(req.query.lastBlockHeight) + 1, 400)
      .then(blocks => {
        res.send(200, {success: true, blocks: blocks})
        next()
      })
      .catch(error => {
        logger.error(error)
        res.send(500, {success: false, error: error})
        next()
      })
  }
}

module.exports = Up
