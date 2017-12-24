const blockchain = require(__root + 'core/blockchainManager')
const p2pInterface = require(__root + 'api/p2p/p2pinterface')
const responseOk = require(__root + 'api/public/v1/responses/ok')

class LoaderController {
    status(req, res, next) {
        // TODO finish

        const instance = blockchain.getInstance()

        responseOk.send(res, {
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

    autoconfigure(req, res, next) {
        const instance = blockchain.getInstance()

        responseOk.send(res, {
            loaded: instance.isSynced(instance.lastBlock),
            now: instance.lastBlock ? instance.lastBlock.data.height : 0,
            blocksCount: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height,
        })

        next()
    }
}

module.exports = new LoaderController
