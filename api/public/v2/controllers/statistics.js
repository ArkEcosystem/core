const Controller = require('./controller')
const _ = require('lodash')

class StatisticsController extends Controller {
  transactions (req, res, next) {
    super.init(req, res, next).then(db => {
      db.transactions.allByDateAndType(0, req.query.from, req.query.to).then(blocks => {
        super.respondWith('ok', {
          data: {
            count: blocks.count,
            amount: _.sumBy(blocks.rows, 'amount'),
            fees: _.sumBy(blocks.rows, 'fee')
          }
        })
      })
    })
  }
  blocks (req, res, next) {
    super.init(req, res, next).then(db => {
      db.blocks.allByDateTimeRange(req.query.from, req.query.to).then(blocks => {
        super.respondWith('ok', {
          data: {
            count: blocks.count,
            rewards: _.sumBy(blocks.rows, 'reward'),
            fees: _.sumBy(blocks.rows, 'totalFee')
          }
        })
      })
    })
  }
}

module.exports = new StatisticsController()
