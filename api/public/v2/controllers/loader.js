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

    configure(req, res, next) {
        res.send({
            data: '/api/loader/configure'
        })

        next()
    }
}

module.exports = new LoaderController
