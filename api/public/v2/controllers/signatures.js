const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v2/responses/ok')

class SignaturesController {
    index(req, res, next) {
        res.send({
            data: '/api/signatures'
        })

        next()
    }

    store(req, res, next) {
        res.send({
            data: '/api/signatures'
        })

        next()
    }
}

module.exports = new SignaturesController
