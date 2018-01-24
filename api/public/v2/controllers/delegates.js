const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class DelegatesController {
  index (req, res, next) {
    db.delegates
      .paginate(helpers.getPaginator())
      .then(delegates => helpers.respondWithPagination(delegates, 'delegate'))
  }

  show (req, res, next) {
    db.delegates
      .findById(req.params.id)
      .then(delegate => helpers.respondWithResource(delegate, 'delegate'))
  }

  blocks (req, res, next) {
    db.delegates
      .findById(req.params.id)
      .then(delegate => db.blocks.paginateByGenerator(delegate.publicKey, helpers.getPaginator()))
      .then(blocks => helpers.respondWithPagination(blocks, 'block'))
  }

  voters (req, res, next) {
    db.delegates
      .findById(req.params.id)
      .then(delegate => db.accounts.findAllByVote(delegate.publicKey))
      .then(accounts => helpers.respondWithCollection(accounts, 'wallet'))
  }
}

module.exports = new DelegatesController()
