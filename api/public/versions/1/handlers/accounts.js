const arkjs = require('arkjs')
const blockchain = require('core/blockchainManager').getInstance()
const config = require('core/config')
const db = require('core/dbinterface').getInstance()
const utils = require('../utils')
const schema = require('../schemas/accounts')

exports.index = {
  handler: (request, h) => {
    return db.wallets
      .findAll({...request.query, ...utils.paginator(request)})
      .then(result => utils.toCollection(request, result.rows, 'wallet'))
      .then(wallets => utils.respondWith({wallets}))
  }
}

exports.show = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getAccount
      }
    }
  },
  handler: (request, h) => {
    return db.wallets
      .findById(request.query.address)
      .then(wallets => {
        if (!wallets) return utils.respondWith('Not found', true)

        return utils.respondWith({
          account: utils.toResource(request, wallets, 'wallet')
        })
      })
  }
}

exports.balance = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBalance
      }
    }
  },
  handler: (request, h) => {
    return db.wallets
      .findById(request.query.address)
      .then(wallet => {
        if (!wallet) return utils.respondWith('Not found', true)

        return utils.respondWith({
          balance: wallet ? wallet.balance : '0',
          unconfirmedBalance: wallet ? wallet.balance : '0'
        })
      })
  }
}

exports.publicKey = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getPublicKey
      }
    }
  },
  handler: (request, h) => {
    return db.wallets
      .findById(request.query.address)
      .then(wallet => {
        if (!wallet) return utils.respondWith('Not found', true)

        return utils.respondWith({ publicKey: wallet.publicKey })
      })
  }
}

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.delegate
    })
  }
}

exports.delegates = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegates
      }
    }
  },
  handler: (request, h) => {
    return db.wallets.findById(request.query.address).then(wallet => {
      if (!wallet) return utils.respondWith('Address not found.', true)
      if (!wallet.vote) return utils.respondWith(`Address ${request.query.address} hasn't voted yet.`, true)

      const lastBlock = blockchain.status.lastBlock.data
      const constants = config.getConstants(lastBlock.height)
      const totalSupply = config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward

      return db.getActiveDelegates(lastBlock.height).then(delegates => {
        const delegateRank = delegates.findIndex(d => d.publicKey === wallet.vote)
        const delegate = delegates[delegateRank]

        return db.wallets.findById(arkjs.crypto.getAddress(wallet.vote, config.network.pubKeyHash)).then(wallet => {
          return utils.respondWith({
            delegates: [{
              username: wallet.username,
              address: wallet.address,
              publicKey: wallet.publicKey,
              vote: delegate.balance + '',
              producedblocks: wallet.producedBlocks,
              missedblocks: 0, // TODO how?
              rate: delegateRank + 1,
              approval: ((delegate.balance / totalSupply) * 100).toFixed(2),
              productivity: (100 - (wallet.missedBlocks / ((wallet.producedBlocks + wallet.missedBlocks) / 100))).toFixed(2)
            }]
          })
        })
      })
    })
  }
}

exports.top = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.top
      }
    }
  },
  handler: (request, h) => {
    return db.wallets
      .top(request.query)
      .then(result => utils.respondWith({ wallets: result.rows }))
  }
}

exports.count = {
  handler: (request, h) => {
    return db.wallets
      .findAll()
      .then(result => utils.respondWith({ count: result.count }))
  }
}
