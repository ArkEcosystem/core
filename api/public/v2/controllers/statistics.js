const responder = requireFrom('api/responder')
const Controller = require('./controller')
const _ = require('lodash')

class StatisticsController extends Controller {
  transactions (req, res, next) {
    super.init(req, res, next).then(db => {
      db.transactionsCache.allByDateAndType(0, req.query.from, req.query.to).then(blocks => {
        responder.ok(req, res, {
          data: {
            count: blocks.count,
            amount: _.sumBy(blocks.rows, 'amount'),
            fees: _.sumBy(blocks.rows, 'fee')
          }
        })

        next()
      })
    })
  }
  blocks (req, res, next) {
    super.init(req, res, next).then(db => {
      db.blocksCache.allByDateTimeRange(req.query.from, req.query.to).then(blocks => {
        responder.ok(req, res, {
          data: {
            count: blocks.count,
            rewards: _.sumBy(blocks.rows, 'reward'),
            fees: _.sumBy(blocks.rows, 'totalFee')
          }
        })

        next()
      })
    })
  }
}

module.exports = new StatisticsController()
