class BlockchainController {
    index(req, res, next) {
        res.send({
            data: '/api/blockchain'
        })

        next()
    }
}

module.exports = new BlockchainController
