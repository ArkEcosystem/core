class BlocksController {
    index(req, res, next) {
        res.send({
            data: '/api/blocks'
        })

        next()
    }

    search(req, res, next) {
        res.send({
            data: '/api/blocks/search'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/blocks/:id'
        })

        next()
    }

    transactions(req, res, next) {
        res.send({
            data: '/api/blocks/:id/transactions'
        })

        next()
    }
}

module.exports = new BlocksController
