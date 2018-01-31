const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const arkjs = require('arkjs')
const utils = require('../utils')

const index = (req, res, next) => {
  db.wallets
    .findAll({...req.query, ...utils.paginator(req)})
    .then(result => utils.toCollection(req, result.rows, 'wallet'))
    .then(wallets => utils.respondWith(req, res, 'ok', {wallets}))
    .then(() => next())
}

const show = (req, res, next) => {
  db.wallets
    .findById(req.query.address)
    .then(wallets => {
      if (!wallets) return utils.respondWith(req, res, 'error', 'Not found')

      return utils.respondWith(req, res, 'ok', {
        account: utils.toResource(req, wallets, 'wallet')
      })
    })
    .then(() => next())
}

const balance = (req, res, next) => {
  db.wallets
    .findById(req.query.address)
    .then(wallet => {
      if (!wallet) return utils.respondWith(req, res, 'error', 'Not found')

      return utils.respondWith(req, res, 'ok', {
        balance: wallet ? wallet.balance : '0',
        unconfirmedBalance: wallet ? wallet.balance : '0'
      })
    })
    .then(() => next())
}

const publicKey = (req, res, next) => {
  db.wallets
    .findById(req.query.address)
    .then(wallet => {
      if (!wallet) return utils.respondWith(req, res, 'error', 'Not found')

      utils.respondWith(req, res, 'ok', { publicKey: wallet.publicKey })
    })
    .then(() => next())
}

const fee = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.delegate
    })
    .then(() => next())
}

const delegates = (req, res, next) => {
  db.wallets.findById(req.query.address).then(wallet => {
    if (!wallet) return utils.respondWith(req, res, 'error', 'Address not found.')
    if (!wallet.vote) return utils.respondWith(req, res, 'error', `Address ${req.query.address} hasn't voted yet.`)

    const lastBlock = blockchain.status.lastBlock.data
    const constants = config.getConstants(lastBlock.height)
    const totalSupply = config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward

    db.getActiveDelegates(lastBlock.height).then(delegates => {
        const delegateRank = delegates.findIndex(d => d.publicKey === wallet.vote)
        const delegate = delegates[delegateRank]

        db.wallets.findById(arkjs.crypto.getAddress(wallet.vote, config.network.pubKeyHash)).then(wallet => {
          utils
            .respondWith(req, res, 'ok', {
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
            .then(() => next())
        })
      })
    })
}

const top = (req, res, next) => {
  db.wallets
    .top(req.query)
    .then(result => utils.respondWith(req, res, 'ok', { wallets: result.rows }))
    .then(() => next())
}

const count = (req, res, next) => {
  db.wallets
    .findAll()
    .then(result => utils.respondWith(req, res, 'ok', { count: result.count }))
    .then(() => next())
}

module.exports = {
  index,
  show,
  balance,
  publicKey,
  fee,
  delegates,
  top,
  count,
}
