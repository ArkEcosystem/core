class TransactionsController {
    index(req, res, next) {
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
}

module.exports = new TransactionsController
