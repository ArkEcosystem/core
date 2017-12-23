const logger = require(__root + 'core/logger')
const arkjs = require('arkjs')
const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')

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

    balance(req, res, next) {
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    res.send(200, {
                        success: true,
                        balance: account ? account.balance : '0',
                        unconfirmedBalance: account ? account.balance : '0',
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

    publicKey(req, res, next) {
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    res.send(200, {
                        success: true,
                        publicKey: account.publicKey,
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

    fee(req, res, next) {
        res.send(200, {
            success: true,
            fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.delegate,
            meta: {
                requestedVersion: req.version(),
                matchedVersion: req.matchedVersion()
            }
        })

        next()
    }

    delegates(req, res, next) {
        if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
            db.getAccount(req.query.address)
                .then(account => {
                    db.getAccount(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash))
                        .then(delegate => {
                            res.send(200, {
                                success: true,
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
                                }],
                                meta: {
                                    requestedVersion: req.version(),
                                    matchedVersion: req.matchedVersion()
                                }
                            })
                        })
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
