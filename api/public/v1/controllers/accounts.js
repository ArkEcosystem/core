const logger = require(__root + 'core/logger')
const arkjs = require('arkjs')
const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')

const responseOk = require(__root + 'api/public/v1/responses/ok')
const responseIntervalServerError = require(__root + 'api/public/v1/responses/exceptions/internal-server-error')
const responseUnprocessableEntity = require(__root + 'api/public/v1/responses/exceptions/unprocessable-entity')

class WalletsController {
    index(req, res, next) {
        res.send({
            data: '/api/accounts'
        })

        next()
    }

    show(req, res, next) {
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    responseOk.send(res, {
                        account: account
                    })
                })
                .catch(error => {
                    logger.error(error)

                    responseIntervalServerError.send(res, {
                        error: error
                    })
                })
        } else {
            responseUnprocessableEntity.send(res, {
                error: 'Object didn\'t pass validation for format address: ' + req.query.address
            })
        }

        next()
    }

    balance(req, res, next) {
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    responseOk.send(res, {
                        balance: account ? account.balance : '0',
                        unconfirmedBalance: account ? account.balance : '0'
                    })
                })
                .catch(error => {
                    logger.error(error)

                    responseIntervalServerError.send(res, {
                        error: error
                    })
                })
        } else  {
            responseUnprocessableEntity.send(res, {
                error: 'Object didn\'t pass validation for format address: ' + req.query.address,
            })
        }

        next()
    }

    publicKey(req, res, next) {
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    responseOk.send(res, {
                        publicKey: account.publicKey,
                    })
                })
                .catch(error => {
                    logger.error(error)

                    responseIntervalServerError.send(res, {
                        success: false,
                        error: error
                    })
                })
        } else {
            responseUnprocessableEntity.send(res, {
                error: 'Object didn\'t pass validation for format address: ' + req.query.address,
            })

        }

        next()
    }

    fee(req, res, next) {
        responseUnprocessableEntity.send(res, {
            fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.delegate,
        })

        next()
    }

    delegates(req, res, next) {
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    db.getAccount(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash))
                        .then(delegate => {
                            responseOk.send(res, {
                                delegates: [{
                                    username: delegate.username,
                                    address: delegate.address,
                                    publicKey: delegate.publicKey,
                                    vote: '0',
                                    producedblocks: '000',
                                    missedblocks: '000',
                                    rate: -1,
                                    approval: 1.14,
                                    productivity: 99.3
                                }]
                            })
                        })
                })
                .catch(error => {
                    logger.error(error)

                    responseIntervalServerError.send(res, {
                        error: error
                    })
                })
        } else {
            responseUnprocessableEntity.send(res, {
                error: 'Object didn\'t pass validation for format address: ' + req.query.address,
            })
        }

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
