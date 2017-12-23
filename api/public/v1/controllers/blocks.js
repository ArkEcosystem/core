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
            data: '/api/blocks/getEpoch'
        })

        next()
    }

    height(req, res, next) {
        res.send({
            data: '/api/blocks/getHeight'
        })

        next()
    }

    nethash(req, res, next) {
        res.send({
            data: '/api/blocks/getNethash'
        })

        next()
    }

    fee(req, res, next) {
        res.send({
            data: '/api/blocks/getFee'
        })

        next()
    }

    fees(req, res, next) {
        res.send({
            data: '/api/blocks/getFees'
        })

        next()
    }

    milestone(req, res, next) {
        res.send({
            data: '/api/blocks/getMilestone'
        })

        next()
    }

    reward(req, res, next) {
        res.send({
            data: '/api/blocks/getReward'
        })

        next()
    }

    supply(req, res, next) {
        res.send({
            data: '/api/blocks/getSupply'
        })

        next()
    }

    status(req, res, next) {
        res.send({
            data: '/api/blocks/getStatus'
        })

        next()
    }

}

module.exports = new BlocksController
