class WalletsController {
    index(req, res, next) {
        res.send({
            data: '/api/accounts'
        })

        next()
    }

    balance(req, res, next) {
        res.send({
            data: '/api/accounts/getBalance'
        })

        next()
    }

    publicKey(req, res, next) {
        res.send({
            data: '/api/accounts/getPublickey'
        })

        next()
    }

    fee(req, res, next) {
        res.send({
            data: '/api/accounts/delegates/fee'
        })

        next()
    }

    delegates(req, res, next) {
        res.send({
            data: '/api/accounts/delegates'
        })

        next()
    }

    accounts(req, res, next) {
        res.send({
            data: '/api/accounts/getAllAccounts'
        })

        next()
    }

    top(req, res, next) {
        res.send({
            data: '/api/accounts/top'
        })

        next()
    }

    count(req, res, next) {
        res.send({
            data: '/api/accounts/count'
        })

        next()
    }

}

module.exports = new WalletsController
