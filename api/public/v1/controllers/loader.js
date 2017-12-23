class LoaderController {
    status(req, res, next) {
        res.send({
            data: '/api/loader/status'
        })

        next()
    }

    sync(req, res, next) {
        res.send({
            data: '/api/loader/status/sync'
        })

        next()
    }

    autoconfigure(req, res, next) {
        res.send({
            data: '/api/loader/autoconfigure'
        })

        next()
    }
}

module.exports = new LoaderController
