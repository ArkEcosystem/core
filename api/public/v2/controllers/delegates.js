class DelegatesController {
    index(req, res, next) {
        res.send({
            data: '/api/delegates'
        })

        next()
    }

    search(req, res, next) {
        res.send({
            data: '/api/delegates/search'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/delegates/:id'
        })

        next()
    }

    blocks(req, res, next) {
        res.send({
            data: '/api/delegates/:id/blocks'
        })

        next()
    }

    transactions(req, res, next) {
        res.send({
            data: '/api/delegates/:id/transactions'
        })

        next()
    }

    voters(req, res, next) {
        res.send({
            data: '/api/delegates/:id/voters'
        })

        next()
    }
}

module.exports = new DelegatesController
