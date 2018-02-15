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

  mountV1 (server) {
    const mapping = {
      '/peer/list': this.getPeers,
      '/peer/blocks': this.getBlocks,
      '/peer/transactionsFromIds': this.getTransactionsFromIds,
      '/peer/height': this.getHeight,
      '/peer/transactions': this.getTransactions,
      '/peer/blocks/common': this.getCommonBlock,
      '/peer/status': this.getStatus
    }

    Promise.all(Object.keys(mapping).map(k => server.get(k, (req, res, next) => mapping[k].call(this, req, res, next))))

    server.post('/blocks', (req, res, next) => this.postBlock(req, res, next))
    server.post('/transactions', (req, res, next) => this.postTransactions(req, res, next))
  }

  mountInternal (server) {
    server.get('/internal/round', (req, res, next) => this.getRound(req, res, next))
    server.post('/internal/block', (req, res, next) => this.postInternalBlock(req, res, next))
    server.post('/internal/verifyTransaction', (req, res, next) => this.postVerifyTransaction(req, res, next))
  }

  mountRemoteInterface (server) {
    server.get('/remote/blockchain/:event', (req, res, next) => this.sendBlockchainEvent(req, res, next))
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
      return next()
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
  }

  async getPeers (req, res, next) {
    try {
      const peers = await this.p2p.getPeers()
      const rpeers = peers
        .map(peer => peer.toBroadcastInfo())
        .sort(() => Math.random() - 0.5)
      res.send(200, {success: true, peers: rpeers})
      next()
    } catch (error) {
      res.send(500, {success: false, message: error})
    }
  }

  getHeight (req, res, next) {
    res.send(200, {
      success: true,
      height: blockchain.getInstance().state.lastBlock.data.height,
      id: blockchain.getInstance().state.lastBlock.data.id
    })
    next()
  }

  async getCommonBlock (req, res, next) {
    const ids = req.query.ids.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    try {
      const commonBlock = await blockchain.getInstance().getDb().getCommonBlock(ids)
      res.send(200, {
        success: true,
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchain.getInstance().state.lastBlock.data.height
      })
      next()
    } catch (error) {
      res.send(500, {success: false, message: error})
    }
  }

  async getTransactionsFromIds (req, res, next) {
    const txids = req.query.ids.split(',').slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))

    try {
      const transactions = await blockchain.getInstance().getDb().getTransactionsFromIds(txids)
      res.send(200, {
        success: true,
        transactions: transactions
      })
      next()
    } catch (error) {
      res.send(500, {success: false, message: error})
    }
  }

  getTransactions (req, res, next) {
    res.send(200, {
      success: true,
      transactions: []
    })
    next()
  }

  sendBlockchainEvent (req, res, next) {
    const bm = blockchain.getInstance()
    if (!bm[req.params.event]) {
      res.send(500, {
        success: false,
        event: req.params.event,
        message: 'No such event'
      })
      next()
    } else {
      if (req.query.param) blockchain.getInstance()[req.params.event](req.params.param)
      else blockchain.getInstance()[req.params.event]()
      res.send(200, {
        success: true,
        event: req.params.event
      })
      next()
    }
  }

  getStatus (req, res, next) {
    const lastBlock = blockchain.getInstance().state.lastBlock.getHeader()
    res.send(200, {
      success: true,
      height: lastBlock.height,
      forgingAllowed: arkjs.slots.getSlotNumber() === arkjs.slots.getSlotNumber(arkjs.slots.getTime() + arkjs.slots.interval / 2),
      currentSlot: arkjs.slots.getSlotNumber(),
      header: lastBlock
    })
    next()
  }

  async getRound (req, res, next) {
    const lastBlock = blockchain.getInstance().state.lastBlock
    const maxActive = this.config.getConstants(lastBlock.data.height).activeDelegates
    const blockTime = this.config.getConstants(lastBlock.data.height).blocktime
    const reward = this.config.getConstants(lastBlock.data.height).reward

    try {
      const delegates = await this.getActiveDelegates(lastBlock.data.height)

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
    } catch (error) {
      res.send(500, {success: false, message: error})
    }

  }

  postInternalBlock (req, res, next) {
    // console.log(req.body)
    blockchain.getInstance().postBlock(req.body)
    res.send(200, {
      success: true
    })
    next()
  }

  async postVerifyTransaction (req, res, next) {
    // console.log(req.body)
    const transaction = new Transaction(Transaction.deserialize(req.body.transaction))
    const result = await blockchain.getInstance().getDb().verifyTransaction(transaction)
    res.send(200, {
      success: result
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

  postTrasactions (req, res, next) {
    const transactions = req.body.transactions
      .map(transaction => Transaction.deserialize(Transaction.serialize(transaction)))
    blockchain.getInstance().postTransactions(transactions)
    res.send(200, {
      success: true
    })
    next()
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

  async getBlocks (req, res, next) {
    try {
      const blocks = await blockchain.getInstance().getDb().getBlocks(parseInt(req.query.lastBlockHeight) + 1, 400)
      res.send(200, {success: true, blocks: blocks})
      next()
    } catch (error) {
      goofy.error(error)
      res.send(500, {success: false, error: error})
      next()
    }
  }
}

module.exports = Up
