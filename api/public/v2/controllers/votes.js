const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class VotesController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      db.transactions.paginateByType(3, this.pager).then(transactions => {
        if (transactions.count) {
          super.respondWithPagination(transactions, 'transaction')
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      db.transactions.findByIdAndType(req.params.id, 3).then(transactions => {
        if (transactions) {
          super.respondWithCollection(transactions, 'transaction')
        } else {
          responder.resourceNotFound(res, 'Record could not be found.');
        }
      })

      next()
    })
  }
}

module.exports = new VotesController()
