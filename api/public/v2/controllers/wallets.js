const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class WalletsController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      db.accounts.paginate(this.pager).then(wallets => {
        super.respondWithPagination(wallets, 'wallet')
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      db.accounts.findById(req.params.id).then(wallet => {
        if (wallet) {
          super.respondWithResource(wallet, 'wallet')
        } else {
          responder.resourceNotFound(res, 'Record could not be found.');
        }
      })

      next()
    })
  }

  transactions(req, res, next) {
    super.setState(req, res).then(() => {
      db.accounts.findById(req.params.id).then(wallet => {
        db.transactions.paginateAllByWallet(wallet, this.pager).then(transactions => {
          if (transactions.count) {
            super.respondWithPagination(transactions, 'transaction')
          } else {
            responder.resourceNotFound(res, 'No resources could not be found.');
          }
        })
      })

      next()
    })
  }

  transactionsSend(req, res, next) {
    super.setState(req, res).then(() => {
      db.accounts.findById(req.params.id).then(wallet => {
        db.transactions.paginateAllBySender(wallet.publicKey, this.pager).then(transactions => {
          if (transactions.count) {
            super.respondWithPagination(transactions, 'transaction')
          } else {
            responder.resourceNotFound(res, 'No resources could not be found.');
          }
        })
      })

      next()
    })
  }

  transactionsReceived(req, res, next) {
    super.setState(req, res).then(() => {
      db.accounts.findById(req.params.id).then(wallet => {
        db.transactions.paginateAllByRecipient(wallet.address, this.pager).then(transactions => {
          if (transactions.count) {
            super.respondWithPagination(transactions, 'transaction')
          } else {
            responder.resourceNotFound(res, 'No resources could not be found.');
          }
        })
      })

      next()
    })
  }

  votes(req, res, next) {
    super.setState(req, res).then(() => {
      db.accounts.findById(req.params.id).then(wallet => {
        db.transactions.paginateVotesBySender(wallet.publicKey, this.pager).then(transactions => {
          if (transactions.count) {
            super.respondWithPagination(transactions, 'transaction')
          } else {
            responder.resourceNotFound(res, 'No resources could not be found.');
          }
        })
      })

      next()
    })
  }
}

module.exports = new WalletsController()
