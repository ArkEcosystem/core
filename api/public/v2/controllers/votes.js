const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v2/responses/ok')

class VotesController {
    index(req, res, next) {
        res.send({
            data: '/api/votes'
        })

        next()
    }

    store(req, res, next) {
        res.send({
            data: '/api/votes'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/votes/:id'
        })

        next()
    }
}

module.exports = new VotesController
