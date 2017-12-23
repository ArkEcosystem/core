const arkjs = require('arkjs')
const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const logger = require(__root + 'core/logger')

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
                    res.send(200, {
                        success: true,
                        account: account,
                        meta: {
                            requestedVersion: req.version(),
                            matchedVersion: req.matchedVersion()
                        }
                    })

                    next()
                })
                .catch(error => {
                    logger.error(error)

                    res.send(500, {
                        success: false,
                        error: error
                    })

                    next()
                })
        } else {
            res.send(200, {
                success: false,
                error: 'Object didn\'t pass validation for format address: ' + req.query.address,
                meta: {
                    requestedVersion: req.version(),
                    matchedVersion: req.matchedVersion()
                }
            })

            next()
        }
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
