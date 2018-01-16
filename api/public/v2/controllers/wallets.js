const Controller = require('./controller')

class WalletsController extends Controller {
  index (req, res, next) {
    super.init(req, res, next).then(db => {
      db.accountsCache.paginate(this.pager).then(wallets => {
        super.respondWithPagination(wallets, 'wallet')
      })
    })
  }

  show (req, res, next) {
    super.init(req, res, next).then(db => {
      db.accountsCache.findById(req.params.id).then(wallet => {
        super.respondWithResource(wallet, 'wallet')
      })
    })
  }

  transactions (req, res, next) {
    super.init(req, res, next).then(db => {
      db.accountsCache.findById(req.params.id).then(wallet => {
        db.transactionsCache.paginateAllByWallet(wallet, this.pager).then(transactions => {
          super.respondWithPagination(transactions, 'transaction')
        })
      })
    })
  }

  transactionsSend (req, res, next) {
    super.init(req, res, next).then(db => {
      db.accountsCache.findById(req.params.id).then(wallet => {
        db.transactionsCache.paginateAllBySender(wallet.publicKey, this.pager).then(transactions => {
          super.respondWithPagination(transactions, 'transaction')
        })
      })
    })
  }

  transactionsReceived (req, res, next) {
    super.init(req, res, next).then(db => {
      db.accountsCache.findById(req.params.id).then(wallet => {
        db.transactionsCache.paginateAllByRecipient(wallet.address, this.pager).then(transactions => {
          super.respondWithPagination(transactions, 'transaction')
        })
      })
    })
  }

  votes (req, res, next) {
    super.init(req, res, next).then(db => {
      db.accountsCache.findById(req.params.id).then(wallet => {
        db.transactionsCache.paginateVotesBySender(wallet.publicKey, this.pager).then(transactions => {
          super.respondWithPagination(transactions, 'transaction')
        })
      })
    })
  }
}

module.exports = new WalletsController()
