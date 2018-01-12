const Controller = require('./controller')

class DelegatesController extends Controller {
  index(req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegates.paginate(this.pager, {
        order: [[ 'publicKey', 'ASC' ]]
      }).then(delegates => {
        super.respondWithPagination(delegates, 'delegate')
      })
    })
  }

  show(req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegates.findById(req.params.id).then(delegate => {
        super.respondWithResource(delegate, 'delegate')
      })
    })
  }

  blocks(req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegates.findById(req.params.id).then(delegate => {
        db.blocks.paginateByGenerator(delegate.publicKey, this.pager).then(blocks => {
          super.respondWithPagination(blocks, 'block')
        })
      })
    })
  }

  voters(req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegates.findById(req.params.id).then(delegate => {
        db.accounts.paginateByVote(delegate.publicKey, this.pager).then(wallets => {
          super.respondWithPagination(wallets, 'wallet')
        })
      })
    })
  }
}

module.exports = new DelegatesController()
