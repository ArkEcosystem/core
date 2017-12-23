class MultiSignaturesController {
    index(req, res, next) {
        res.send({
            data: '/api/multisignatures'
        })

        next()
    }

    store(req, res, next) {
        res.send({
            data: '/api/multisignatures'
        })

        next()
    }

    pending(req, res, next) {
        res.send({
            data: '/api/multisignatures/pending'
        })

        next()
    }

    wallets(req, res, next) {
        res.send({
            data: '/api/multisignatures/wallets'
        })

        next()
    }
}

module.exports = new MultiSignaturesController
