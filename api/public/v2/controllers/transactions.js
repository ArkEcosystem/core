const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v2/responses/ok')

class TransactionsController {
    index(req, res, next) {
        res.send({
            data: '/api/transactions'
        })

        next()
    }

    search(req, res, next) {
        res.send({
            data: '/api/transactions/search'
        })

        next()
    }

    store(req, res, next) {
        res.send({
            data: '/api/transactions'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/transactions/:id'
        })

        next()
    }

    unconfirmed(req, res, next) {
        res.send({
            data: '/api/transactions/unconfirmed'
        })

        next()
    }

    showUnconfirmed(req, res, next) {
        res.send({
            data: '/api/transactions/unconfirmed/:id'
        })

        next()
    }

    fees(req, res, next) {
        res.send({
            data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.send
        })

        next()
    }

    showFee(req, res, next) {
        res.send({
            data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees[req.params.type]
        })

        next()
    }
}

module.exports = new TransactionsController
