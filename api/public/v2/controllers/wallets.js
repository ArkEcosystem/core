const arkjs = require('arkjs')
const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const logger = require(__root + 'core/logger')
const responseOk = require(__root + 'api/public/v2/responses/ok')
const responseIntervalServerError = require(__root + 'api/public/v2/responses/exceptions/internal-server-error')
const responseUnprocessableEntity = require(__root + 'api/public/v2/responses/exceptions/unprocessable-entity')

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
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    responseOk.send(req, res, {
                        account: account
                    })
                })
                .catch(error => {
                    logger.error(error)

                    responseIntervalServerError.send(req, res, {
                        error
                    })
                })
        } else {
            responseUnprocessableEntity.send(req, res, [
                "Object didn't pass validation for format address: " + req.query.address,
            ])
        }

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
