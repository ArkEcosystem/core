class DelegatesController {
    index(req, res, next) {
        res.send({
            data: '/api/delegates'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/delegates/get'
        })

        next()
    }

    count(req, res, next) {
        res.send({
            data: '/api/delegates/count'
        })

        next()
    }

    search(req, res, next) {
        res.send({
            data: '/api/delegates/search'
        })

        next()
    }

    voters(req, res, next) {
        res.send({
            data: '/api/delegates/voters'
        })

        next()
    }

    fee(req, res, next) {
        res.send({
            data: '/api/delegates/fee'
        })

        next()
    }

    forged(req, res, next) {
        res.send({
            data: '/api/delegates/forging/getForgedByAccount'
        })

        next()
    }

    next(req, res, next) {
        res.send({
            data: '/api/delegates/getNextForgers'
        })

        next()
    }

    enable(req, res, next) {
        res.send({
            data: '/api/delegates/forging/enable'
        })

        next()
    }

    disable(req, res, next) {
        res.send({
            data: '/api/delegates/forging/disable'
        })

        next()
    }

}

module.exports = new DelegatesController
