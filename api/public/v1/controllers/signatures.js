class SignaturesController {
    index(req, res, next) {
        res.send({
            data: '/api/signatures'
        })

        next()
    }

    fee(req, res, next) {
        res.send({
            data: '/api/signatures/fee'
        })

        next()
    }
}

module.exports = new SignaturesController
