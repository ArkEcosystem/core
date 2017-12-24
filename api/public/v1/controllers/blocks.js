const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v1/responses/ok')

class BlocksController {
    index(req, res, next) {
        res.send({
            data: '/api/blocks'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/blocks/get'
        })

        next()
    }

    epoch(req, res, next) {
        res.send({
            epoch: config.getConstants(blockchain.getInstance().lastBlock.data.height).epoch
        })

        next()
    }

    height(req, res, next) {
        let block = blockchain.getInstance().lastBlock.data;

        res.send({
            height: block.height,
            id: block.id
        })

        next()
    }

    nethash(req, res, next) {
        res.send({
            nethash: config.network.nethash
        })

        next()
    }

    fee(req, res, next) {
        res.send({
            fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.send
        })

        next()
    }

    fees(req, res, next) {
        res.send({
            fees: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees
        })

        next()
    }

    milestone(req, res, next) {
    	// @TODO

        res.send({
            milestone: __private.blockReward.calcMilestone(modules.blockchain.getLastBlock().height)
        })

        next()
    }

    reward(req, res, next) {
    	// @TODO

        res.send({
            reward: __private.blockReward.calcReward(modules.blockchain.getLastBlock().height)
        })

        next()
    }

    supply(req, res, next) {
    	// @TODO

        res.send({
            supply: __private.blockReward.calcSupply(modules.blockchain.getLastBlock().height)
        })

        next()
    }

    status(req, res, next) {
    	// @TODO

        let block = blockchain.getInstance().lastBlock.data;

        res.send({
            epoch: config.getConstants(blockchain.getInstance().lastBlock.data.height).epoch,
            height: block.height,
            fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.send,
            milestone: __private.blockReward.calcMilestone(block.height),
            nethash: library.config.nethash,
            reward: __private.blockReward.calcReward(block.height),
            supply: __private.blockReward.calcSupply(block.height)
        })

        next()
    }

}

module.exports = new BlocksController
