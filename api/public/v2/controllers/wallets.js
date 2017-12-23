class WalletsController {
    index(req, res, next) {
        res.send({
            data: '/api/wallets'
        })

        next()
    }

    search(req, res, next) {
        res.send({
            data: '/api/wallets/search'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/wallets/:id'
        })

        next()
    }

    transactions(req, res, next) {
        res.send({
            data: '/api/wallets/:id/transactions'
        })

        next()
    }

    votes(req, res, next) {
        res.send({
            data: '/api/wallets/:id/votes'
        })

        next()
    }
}

module.exports = new WalletsController
