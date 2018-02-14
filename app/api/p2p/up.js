const Hapi = require('hapi')
const arkjs = require('arkjs')
const crypto = require('crypto')
const requestIp = require('request-ip')
const goofy = require('app/core/goofy')
const blockchain = require('app/core/managers/blockchain')
const Transaction = require('app/models/transaction')

const _headers = {
  os: require('os').platform()
}

function setHeaders (h) {
  ['nethash', 'os', 'version', 'port'].forEach((key) => h.header(key, _headers[key]))
}

function isLocalhost (request) {
  return request.connection.remoteAddress === '::1' || request.connection.remoteAddress === '127.0.0.1' || request.connection.remoteAddress === '::ffff:127.0.0.1'
}

let p2p

class Up {
  constructor (config) {
    this.port = config.server.port
    this.config = config
    _headers.version = config.server.version
    _headers.port = config.server.port
    _headers.nethash = config.network.nethash
  }

  async start (p2pInstance) {
    p2p = p2pInstance

    const server = new Hapi.Server({
      port: this.port
    })

    await server.ext({
      type: 'onRequest',
      method: async (request, h) => {
        if ((request.path.startsWith('/internal/') || request.path.startsWith('/remote/')) && !isLocalhost(request)) {
          return h.response({
            code: 'ResourceNotFound',
            message: `${request.path} does not exist`
          }).code(500)
        }

        if (request.path.startsWith('/peer/')) {
          const peer = {}
          peer.ip = requestIp.getClientIp(request);
          ['port', 'nethash', 'os', 'version'].forEach(key => (peer[key] = request.headers[key]))

          try {
            await p2p.acceptNewPeer(peer)
            await setHeaders(h)
          } catch (error) {
            return h.response({success: false, message: error}).code(500)
          }
        }

        return h.continue
      }
    })

    await this.mountInternal(server)

    if (this.config.api.p2p.remoteinterface) {
      await this.mountRemoteInterface(server)
    }

    await this.mountV1(server)

    try {
      await server.start()

      goofy.info(`Oh hapi day! P2P API is listening on ${server.info.uri}`)
    } catch (err) {
      goofy.error(err)

      process.exit(1)
    }
  }

  mountV1 (server) {
    server.route({ method: 'GET', path: '/peer/list', handler: this.getPeers })
    server.route({ method: 'GET', path: '/peer/blocks', handler: this.getBlocks })
    server.route({ method: 'GET', path: '/peer/transactionsFromIds', handler: this.getTransactionsFromIds })
    server.route({ method: 'GET', path: '/peer/height', handler: this.getHeight })
    server.route({ method: 'GET', path: '/peer/transactions', handler: this.getTransactions })
    server.route({ method: 'GET', path: '/peer/blocks/common', handler: this.getCommonBlock })
    server.route({ method: 'GET', path: '/peer/status', handler: this.getStatus })
    server.route({ method: 'POST', path: '/blocks', handler: this.postBlock })
    server.route({ method: 'POST', path: '/transactions', handler: this.postTransactions })
  }

  mountInternal (server) {
    server.route({ method: 'GET', path: '/internal/round', handler: this.getRound })
    server.route({ method: 'POST', path: '/internal/block', handler: this.postInternalBlock })
    server.route({ method: 'POST', path: '/internal/verifyTransaction', handler: this.postVerifyTransaction })
  }

  mountRemoteInterface (server) {
    server.route({ method: 'GET', path: '/remote/blockchain/:event', handler: this.sendBlockchainEvent })
  }

  async getPeers (request, h) {
    try {
      const peers = await p2p.getPeers()

      const rpeers = peers
        .map(peer => peer.toBroadcastInfo())
        .sort(() => Math.random() - 0.5)

      return {success: true, peers: rpeers}
    } catch (error) {
      return h.response({success: false, message: error}).code(500)
    }
  }

  getHeight (request, h) {
    return {
      success: true,
      height: blockchain.getInstance().getState().lastBlock.data.height,
      id: blockchain.getInstance().getState().lastBlock.data.id
    }
  }

  async getCommonBlock (request, h) {
    const ids = request.query.ids.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    try {
      const commonBlock = await blockchain.getInstance().getDb().getCommonBlock(ids)

      return {
        success: true,
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchain.getInstance().getState().lastBlock.data.height
      }
    } catch (error) {
      return h.response({success: false, message: error}).code(500)
    }
  }

  async getTransactionsFromIds (request, h) {
    const txids = request.query.ids.split(',').slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))

    try {
      const transactions = await blockchain.getInstance().getDb().getTransactionsFromIds(txids)

      return {
        success: true,
        transactions: transactions
      }
    } catch (error) {
      return h.response({success: false, message: error}).code(500)
    }
  }

  getTransactions (request, h) {
    return {
      success: true,
      transactions: []
    }
  }

  async sendBlockchainEvent (request, h) {
    const bm = blockchain.getInstance()

    if (!bm[request.params.event]) {
      return h.response({
        success: false,
        event: request.params.event,
        message: 'No such event'
      }).code(500)
    }

    await request.query.param
      ? bm[request.params.event](request.params.param)
      : bm[request.params.event]()

    return {
      success: true,
      event: request.params.event
    }
  }

  getStatus (request, h) {
    const lastBlock = blockchain.getInstance().getState().lastBlock.getHeader()

    return {
      success: true,
      height: lastBlock.height,
      forgingAllowed: arkjs.slots.getSlotNumber() === arkjs.slots.getSlotNumber(arkjs.slots.getTime() + arkjs.slots.interval / 2),
      currentSlot: arkjs.slots.getSlotNumber(),
      header: lastBlock
    }
  }

  async getRound (request, h) {
    const lastBlock = blockchain.getInstance().getState().lastBlock
    const maxActive = this.config.getConstants(lastBlock.data.height).activeDelegates
    const blockTime = this.config.getConstants(lastBlock.data.height).blocktime
    const reward = this.config.getConstants(lastBlock.data.height).reward

    try {
      const delegates = await this.getActiveDelegates(lastBlock.data.height)

      return {
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
      }
    } catch (error) {
      return h.response({success: false, message: error}).code(500)
    }
  }

  postInternalBlock (request, h) {
    // console.log(request.body)

    blockchain.getInstance().postBlock(request.body)

    return {success: true}
  }

  async postVerifyTransaction (request, h) {
    // console.log(request.body)

    const transaction = new Transaction(Transaction.deserialize(request.body.transaction))
    const result = await blockchain.getInstance().getDb().verifyTransaction(transaction)

    return {success: result}
  }

  postBlock (request, h) {
    blockchain.getInstance().postBlock(request.body)

    return {success: true}
  }

  postTransactions (request, h) {
    const transactions = request.body.transactions
      .map(transaction => Transaction.deserialize(Transaction.serialize(transaction)))

    blockchain.getInstance().postTransactions(transactions)

    return {success: true}
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

  async getBlocks (request, h) {
    try {
      const blocks = await blockchain.getInstance().getDb().getBlocks(parseInt(request.query.lastBlockHeight) + 1, 400)

      return {success: true, blocks: blocks}
    } catch (error) {
      goofy.error(error)

      h.response({success: false, error: error}).code(500)
    }
  }
}

module.exports = Up
