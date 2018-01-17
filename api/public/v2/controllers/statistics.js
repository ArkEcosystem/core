const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')
const _ = require('lodash')

class StatisticsController {
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
