class PeersController {
    index(req, res, next) {
        res.send({
            data: '/api/peers'
        })

        next()
    }

    search(req, res, next) {
        res.send({
            data: '/api/peers/search'
        })

        next()
    }

    me(req, res, next) {
        res.send({
            data: '/api/peers/me'
        })

        next()
    }

    show(req, res, next) {
        res.send({
            data: '/api/peers/:ip/:port'
        })

        next()
    }
}

module.exports = new PeersController
