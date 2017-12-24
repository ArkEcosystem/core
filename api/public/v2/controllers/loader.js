const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v2/responses/ok')

class LoaderController {
    status(req, res, next) {
        // TODO finish

        const instance = blockchain.getInstance()

        responseOk.send(req, res, {
            loaded: instance.isSynced(instance.lastBlock),
            now: instance.lastBlock ? instance.lastBlock.data.height : 0,
            blocksCount: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height
        })

        next()
    }

    sync(req, res, next) {
        res.send({
            data: '/api/loader/status/sync'
        })

        next()
    }

    configure(req, res, next) {
        responseOk.send(req, res, {
            network: config.network
        })

        next()
    }
}

module.exports = new LoaderController
