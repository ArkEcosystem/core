class SignaturesController {
    index(req, res, next) {
        res.send({
            data: '/api/signatures'
        })

        next()
    }

    store(req, res, next) {
        res.send({
            data: '/api/signatures'
        })

        next()
    }
}

module.exports = new SignaturesController
