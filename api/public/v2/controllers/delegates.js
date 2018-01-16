const Controller = require('./controller')

class DelegatesController extends Controller {
  index (req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegatesCache.paginate(this.pager, {
        order: [[ 'publicKey', 'ASC' ]]
      }).then(delegates => {
        super.respondWithPagination(delegates, 'delegate')
      })
    })
  }

  show (req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegatesCache.findById(req.params.id).then(delegate => {
        super.respondWithResource(delegate, 'delegate')
      })
    })
  }

  blocks (req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegatesCache.findById(req.params.id).then(delegate => {
        db.blocksCache.paginateByGenerator(delegate.publicKey, this.pager).then(blocks => {
          super.respondWithPagination(blocks, 'block')
        })
      })
    })
  }

  voters (req, res, next) {
    super.init(req, res, next).then(db => {
      db.delegatesCache.findById(req.params.id).then(delegate => {
        db.accountsCache.paginateByVote(delegate.publicKey, this.pager).then(wallets => {
          super.respondWithPagination(wallets, 'wallet')
        })
      })
    })
  }
}

module.exports = new DelegatesController()
