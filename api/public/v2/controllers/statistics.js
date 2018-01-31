const chainInstance = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const _ = require('lodash')
const utils = require('../utils')

const blockchain = (req, res, next) => {
  const lastBlock = chainInstance.status.lastBlock

  const height = chainInstance.status.lastBlock.data.height
  const initialSupply = config.genesisBlock.totalAmount / 10 ** 8

  const constants = config.getConstants(height)
  const rewardPerBlock = constants.reward / 10 ** 8

  const totalSupply = config.genesisBlock.totalAmount + (lastBlock.data.height - constants.height) * constants.reward

  db.getActiveDelegates(height).then(delegates => {
    Promise.all(delegates.map(d => {
      return db.wallets.findById(d.publicKey).then(wallet => {
        return {
          username: wallet.username,
          approval: ((d.balance / totalSupply) * 100).toFixed(2),
          productivity: (100 - (wallet.missedBlocks / ((wallet.producedBlocks + wallet.missedBlocks) / 100))).toFixed(2)
        }
      })
    })).then((wallets) => {
      const walletsByProductivity = _.sortBy(wallets, 'productivity')

      utils
        .respondWith(req, res, 'ok', {
          supply: {
            initial: initialSupply * 10 ** 8,
            current: (initialSupply + ((height - config.getConstants(height).height) * rewardPerBlock)) * 10 ** 8
          },
          blocks: {
            forged: height,
            rewards: height * rewardPerBlock
          },
          rewards: {
            start: constants.height,
            total: height * rewardPerBlock
          },
          productivity: {
            best: walletsByProductivity[0],
            worst: walletsByProductivity.reverse()[0]
          }
        })
        .then(() => next())
    })
  })
}

const transactions = (req, res, next) => {
  db.transactions
    .findAllByDateAndType(0, req.query.from, req.query.to)
    .then(blocks => utils.respondWith(req, res, 'ok', {
      count: blocks.count,
      amount: _.sumBy(blocks.rows, 'amount'),
      fees: _.sumBy(blocks.rows, 'fee')
    }))
    .then(() => next())
}

const blocks = (req, res, next) => {
  db.blocks
    .findAllByDateTimeRange(req.query.from, req.query.to)
    .then(blocks => utils.respondWith(req, res, 'ok', {
      count: blocks.count,
      rewards: _.sumBy(blocks.rows, 'reward'),
      fees: _.sumBy(blocks.rows, 'totalFee')
    }))
    .then(() => next())
}

const votes = (req, res, next) => {
  db.transactions
    .findAllByDateAndType(3, req.query.from, req.query.to)
    .then(transactions => transactions.rows.filter(v => v.asset.votes[0].startsWith('+')))
    .then(transactions => utils.respondWith(req, res, 'ok', {
      count: transactions.length,
      amount: _.sumBy(transactions.rows, 'amount'),
      fees: _.sumBy(transactions, 'fee')
    }))
    .then(() => next())
}

const unvotes = (req, res, next) => {
  db.transactions
    .findAllByDateAndType(3, req.query.from, req.query.to)
    .then(transactions => transactions.rows.filter(v => v.asset.votes[0].startsWith('-')))
    .then(transactions => utils.respondWith(req, res, 'ok', {
      count: transactions.length,
      amount: _.sumBy(transactions.rows, 'amount'),
      fees: _.sumBy(transactions, 'fee')
    }))
    .then(() => next())
}

module.exports = {
  blockchain,
  transactions,
  blocks,
  votes,
  unvotes,
}
