const blockchain = require(__root + 'core/blockchainManager')
const p2pInterface = require(__root + 'api/p2p/p2pinterface')

class LoaderController {
    status(req, res, next) {
        // TODO finish
        res.send(200, {
            success: true,
            loaded: blockchain.getInstance().isSynced(blockchain.getInstance().lastBlock),
            now: blockchain.getInstance().lastBlock ? blockchain.getInstance().lastBlock.data.height : 0,
            blocksCount: blockchain.getInstance().networkInterface.getNetworkHeight() - blockchain.getInstance().lastBlock.data.height,
            meta: {
                requestedVersion: req.version(),
                matchedVersion: req.matchedVersion()
            }
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
        res.send(200, {
            success: true,
            loaded: blockchain.getInstance().isSynced(blockchain.getInstance().lastBlock),
            now: blockchain.getInstance().lastBlock ? blockchain.getInstance().lastBlock.data.height : 0,
            blocksCount: blockchain.getInstance().networkInterface.getNetworkHeight() - blockchain.getInstance().lastBlock.data.height,
            meta: {
                requestedVersion: req.version(),
                matchedVersion: req.matchedVersion()
            }
        })

        next()
    }
}

module.exports = new LoaderController
