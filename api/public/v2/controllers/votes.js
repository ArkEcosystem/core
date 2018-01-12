const Controller = require('./controller')

class VotesController extends Controller {
  index(req, res, next) {
    super.setState(req, res, next).then(db => {
      db.transactions.paginateByType(3, this.pager).then(transactions => {
        super.respondWithPagination(transactions.count, transactions, 'transaction')
      })
    })
  }

  show(req, res, next) {
    super.setState(req, res, next).then(db => {
      db.transactions.findByIdAndType(req.params.id, 3).then(transaction => {
        super.respondWithCollection(transaction, transaction, 'transaction')
      })
    })
  }
}

module.exports = new VotesController()
