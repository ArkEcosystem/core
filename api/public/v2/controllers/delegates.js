const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class DelegatesController {
  index (req, res, next) {
    db.delegates.paginate(helpers.initPager()).then(delegates => {
      helpers.respondWithPagination(delegates, 'delegate')
    })
  }

  show (req, res, next) {
    db.delegates.findById(req.params.id).then(delegate => {
      helpers.respondWithResource(delegate, 'delegate')
    })
  }

  blocks (req, res, next) {
    db.delegates.findById(req.params.id).then(delegate => {
      db.blocks.paginateByGenerator(delegate.publicKey, helpers.initPager()).then(blocks => {
        helpers.respondWithPagination(blocks, 'block')
      })
    })
  }

  voters (req, res, next) {
    db.delegates.findById(req.params.id).then(delegate => {
      db.accounts.paginateByVote(delegate.publicKey, helpers.initPager()).then(wallets => {
        helpers.respondWithPagination(wallets, 'wallet')
      })
    })
  }
}

module.exports = new DelegatesController()
