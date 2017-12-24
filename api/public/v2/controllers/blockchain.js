const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v2/responses/ok')

class BlockchainController {
    index(req, res, next) {
        responseOk.send(req, res, {
            data: config.getConstants(blockchain.getInstance().lastBlock.data.height)
        })

        next()
    }
}

module.exports = new BlockchainController
