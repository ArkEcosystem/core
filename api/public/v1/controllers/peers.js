class PeersController {
    index(req, res, next) {
        res.send({
            data: '/api/peers'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/peers/get'
        })

        next()
    }

    version(req, res, next) {
        res.send({
            data: '/api/peers/version'
        })

        next()
    }
}

module.exports = new PeersController
