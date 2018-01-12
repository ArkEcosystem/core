const Controller = require('./controller')

class VotesController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.transactions.paginateByType(3, this.pager).then(transactions => {
        super.respondWithPagination(transactions.count, transactions, 'transaction')
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.transactions.findByIdAndType(req.params.id, 3).then(transaction => {
        super.respondWithCollection(transaction, transaction, 'transaction')
      })

      next()
    })
  }
}

module.exports = new VotesController()
