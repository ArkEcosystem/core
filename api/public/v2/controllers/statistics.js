const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')
const _ = require('lodash')

class StatisticsController {
  blockchain (req, res, next) {
    const lastBlock = blockchain.status.lastBlock

    const height = blockchain.status.lastBlock.data.height
    const initialSupply = config.genesisBlock.totalAmount / 10 ** 8

    const constants = config.getConstants(height)
    const rewardPerBlock = constants.reward / 10 ** 8

    const totalSupply = config.genesisBlock.totalAmount + (lastBlock.data.height - constants.height) * constants.reward

    db.getActiveDelegates(height).then(delegates => {
      Promise.all(delegates.map(d => {
        return db.accounts.findById(d.publicKey).then(account => {
          return {
            username: account.username,
            approval: ((d.balance / totalSupply) * 100).toFixed(2),
            productivity: (100 - (account.missedBlocks / ((account.producedBlocks + account.missedBlocks) / 100))).toFixed(2)
          }
        })
      })).then((accounts) => {
        const walletsByProductivity = _.sortBy(accounts, 'productivity')

        helpers.respondWith('ok', {
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
      })
    })
  }

  transactions (req, res, next) {
    db.transactions
      .allByDateAndType(0, req.params.from, req.params.to)
      .then(blocks => helpers.respondWith('ok', {
        count: blocks.count,
        amount: _.sumBy(blocks.rows, 'amount'),
        fees: _.sumBy(blocks.rows, 'fee')
      }))
  }

  blocks (req, res, next) {
    db.blocks
      .allByDateTimeRange(req.params.from, req.params.to)
      .then(blocks => helpers.respondWith('ok', {
        count: blocks.count,
        rewards: _.sumBy(blocks.rows, 'reward'),
        fees: _.sumBy(blocks.rows, 'totalFee')
      }))
  }

  votes (req, res, next) {
    db.transactions
      .allByDateAndType(3, req.params.from, req.params.to)
      .then(transactions => transactions.rows.filter(v => v.asset.votes[0].startsWith('+')))
      .then(transactions => helpers.respondWith('ok', {
        count: transactions.length,
        amount: _.sumBy(transactions.rows, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }))
  }

  unvotes (req, res, next) {
    db.transactions
      .allByDateAndType(3, req.params.from, req.params.to)
      .then(transactions => transactions.rows.filter(v => v.asset.votes[0].startsWith('-')))
      .then(transactions => helpers.respondWith('ok', {
        count: transactions.length,
        amount: _.sumBy(transactions.rows, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }))
  }
}

module.exports = new StatisticsController()
