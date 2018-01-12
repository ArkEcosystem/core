const Controller = require('./controller')

class WalletsController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.accounts.paginate(this.pager).then(wallets => {
        super.respondWithPagination(wallets.count, wallets, 'wallet')
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.accounts.findById(req.params.id).then(wallet => {
        super.respondWithResource(wallet, wallet, 'wallet')
      })

      next()
    })
  }

  transactions(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.accounts.findById(req.params.id).then(wallet => {
        super.db.transactions.paginateAllByWallet(wallet, this.pager).then(transactions => {
          super.respondWithPagination(transactions.count, transactions, 'transaction')
        })
      })

      next()
    })
  }

  transactionsSend(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.accounts.findById(req.params.id).then(wallet => {
        super.db.transactions.paginateAllBySender(wallet.publicKey, this.pager).then(transactions => {
          super.respondWithPagination(transactions.count, transactions, 'transaction')
        })
      })

      next()
    })
  }

  transactionsReceived(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.accounts.findById(req.params.id).then(wallet => {
        super.db.transactions.paginateAllByRecipient(wallet.address, this.pager).then(transactions => {
          super.respondWithPagination(transactions.count, transactions, 'transaction')
        })
      })

      next()
    })
  }

  votes(req, res, next) {
    super.setState(req, res).then(db => {
      super.db.accounts.findById(req.params.id).then(wallet => {
        super.db.transactions.paginateVotesBySender(wallet.publicKey, this.pager).then(transactions => {
          super.respondWithPagination(transactions.count, transactions, 'transaction')
        })
      })

      next()
    })
  }
}

module.exports = new WalletsController()
