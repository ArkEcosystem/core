const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')
const _ = require('lodash')

class StatisticsController {
  blockchain (req, res, next) {
    const height = blockchain.status.lastBlock.data.height
    const initialSupply = config.genesisBlock.totalAmount / 10 ** 8
    const rewardPerBlock = config.getConstants(height).reward / 10 ** 8

    helpers.respondWith('ok', {
      data: {
        supply: {
          initial: initialSupply * 10 ** 8,
          current: (initialSupply + ((height - config.getConstants(height).height) * rewardPerBlock)) * 10 ** 8
        },
        blocks: {
          forged: height,
          reward: height * rewardPerBlock
        }
      }
    })
  }

  transactions (req, res, next) {
    db.transactions.allByDateAndType(0, req.query.from, req.query.to).then(blocks => {
      helpers.respondWith('ok', {
        data: {
          count: blocks.count,
          amount: _.sumBy(blocks.rows, 'amount'),
          fees: _.sumBy(blocks.rows, 'fee')
        }
      })
    })
  }

  blocks (req, res, next) {
    db.blocks.allByDateTimeRange(req.query.from, req.query.to).then(blocks => {
      helpers.respondWith('ok', {
        data: {
          count: blocks.count,
          rewards: _.sumBy(blocks.rows, 'reward'),
          fees: _.sumBy(blocks.rows, 'totalFee')
        }
      })
    })
  }
}

module.exports = new StatisticsController()
