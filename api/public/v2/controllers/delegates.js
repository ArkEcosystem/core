const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class DelegatesController {
  index (req, res, next) {
    db.delegates
      .paginate(utils.paginator())
      .then(delegates => utils.respondWithPagination(delegates, 'delegate'))
      .then(() => next())
  }

  show (req, res, next) {
    db.delegates
      .findById(req.params.id)
      .then(delegate => utils.respondWithResource(delegate, 'delegate'))
      .then(() => next())
  }

  blocks (req, res, next) {
    db.delegates
      .findById(req.params.id)
      .then(delegate => db.blocks.findAllByGenerator(delegate.publicKey, utils.paginator()))
      .then(blocks => utils.respondWithPagination(blocks, 'block'))
      .then(() => next())
  }

  voters (req, res, next) {
    db.delegates
      .findById(req.params.id)
      .then(delegate => db.wallets.findAllByVote(delegate.publicKey))
      .then(wallets => utils.respondWithCollection(wallets, 'wallet'))
      .then(() => next())
  }
}

module.exports = new DelegatesController()
