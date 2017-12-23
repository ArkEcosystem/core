class VotesController {
    index(req, res, next) {
        res.send({
            data: '/api/votes'
        })

        next()
    }

    store(req, res, next) {
        res.send({
            data: '/api/votes'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/votes/:id'
        })

        next()
    }
}

module.exports = new VotesController
