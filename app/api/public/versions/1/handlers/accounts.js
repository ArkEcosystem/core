const arkjs = require('arkjs')
const blockchain = require('app/core/blockchainManager').getInstance()
const state = blockchain.getState()
const config = require('app/core/config')
const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')
const schema = require('../schemas/accounts')
const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

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
      .then(account => {
        if (!account) return utils.respondWith('Not found', true)

        return utils
          .toResource(request, account, 'wallet')
          .then(account => utils.respondWith({account}))
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
      .then(account => {
        if (!account) return utils.respondWith('Not found', true)

        return utils.respondWith({
          balance: account ? account.balance : '0',
          unconfirmedBalance: account ? account.balance : '0'
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
      .then(account => {
        if (!account) return utils.respondWith('Not found', true)

        return utils.respondWith({ publicKey: account.publicKey })
      })
  }
}

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.delegate
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
    return db.wallets.findById(request.query.address).then(account => {
      if (!account) return utils.respondWith('Address not found.', true)
      if (!account.vote) return utils.respondWith(`Address ${request.query.address} hasn't voted yet.`, true)

      return db.getActiveDelegates(state.lastBlock.data.height).then(delegates => {
        const delegateRank = delegates.findIndex(d => d.publicKey === account.vote)
        const delegate = delegates[delegateRank] || {}

        return db.wallets.findById(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash)).then(account => {
          return utils.respondWith({
            delegates: [{
              username: account.username,
              address: account.address,
              publicKey: account.publicKey,
              vote: delegate.balance + '',
              producedblocks: account.producedBlocks,
              missedblocks: account.missedBlocks, // TODO how?
              rate: delegateRank + 1,
              approval: calculateApproval(delegate),
              productivity: calculateProductivity(account)
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
