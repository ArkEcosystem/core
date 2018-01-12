const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class WalletsController extends Controller {
  index(req, res, next) {
    const pager = super.pager(req)

    db.accounts.paginate(pager).then(wallets => {
      super.respondWithPagination(wallets, 'wallet', pager, req, res)
    })

    next()
  }

  show(req, res, next) {
    db.accounts.findById(req.params.id).then(wallet => {
      if (wallet) {
        super.respondWithResource(req, res, wallet, 'wallet')
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
  }

  transactions(req, res, next) {
    db.accounts.findById(req.params.id).then(wallet => {
      const pager = super.pager(req)

      db.transactions.paginateAllByWallet(wallet, pager).then(transactions => {
        if (transactions.count) {
          super.respondWithPagination(transactions, 'transaction', pager, req, res)
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }

  transactionsSend(req, res, next) {
    db.accounts.findById(req.params.id).then(wallet => {
      const pager = super.pager(req)

      db.transactions.paginateAllBySender(wallet.publicKey, pager).then(transactions => {
        if (transactions.count) {
          super.respondWithPagination(transactions, 'transaction', pager, req, res)
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }

  transactionsReceived(req, res, next) {
    db.accounts.findById(req.params.id).then(wallet => {
      const pager = super.pager(req)

      db.transactions.paginateAllByRecipient(wallet.address, pager).then(transactions => {
        if (transactions.count) {
          super.respondWithPagination(transactions, 'transaction', pager, req, res)
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }

  votes(req, res, next) {
    db.accounts.findById(req.params.id).then(wallet => {
      const pager = super.pager(req)

      db.transactions.paginateVotesBySender(wallet.publicKey, pager).then(transactions => {
        if (transactions.count) {
          super.respondWithPagination(transactions, 'transaction', pager, req, res)
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }
}

module.exports = new WalletsController()
