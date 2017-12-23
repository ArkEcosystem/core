class ForgingController {
    round(req, res, next) {
        res.send({
            data: '/api/forging/round'
        })

        next()
    }

    next(req, res, next) {
        res.send({
            data: '/api/forging/next'
        })

        next()
    }

    previous(req, res, next) {
        res.send({
            data: '/api/forging/previous'
        })

        next()
    }
}

module.exports = new ForgingController
