const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v2/responses/ok')
const transactions = require(__root + 'repositories/transactions')
const Paginator = require(__root + 'api/public/paginator')

class TransactionsController {
    index(req, res, next) {
        let page = parseInt(req.query.page || 1);
        let perPage = parseInt(req.query.perPage || 50);

        transactions.paginate({}, page, perPage).then(result => {
            const paginator = new Paginator(req, result.count, page, perPage)

            responseOk.send(req, res, {
                data: result.rows,
                links: paginator.links(),
                meta: Object.assign(paginator.meta(), {
                    count: result.count
                }),
            })
        });

        next()
    }

    search(req, res, next) {
        res.send({
            data: '/api/transactions/search'
        })

        next()
    }

    store(req, res, next) {
        res.send({
            data: '/api/transactions'
        })

        next()
    }

    show(req, res, next) {
        transactions.findById(req.params.id).then(result => {
            res.send({
                data: result
            })
        });

        next()
    }

    unconfirmed(req, res, next) {
        res.send({
            data: '/api/transactions/unconfirmed'
        })

        next()
    }

    showUnconfirmed(req, res, next) {
        res.send({
            data: '/api/transactions/unconfirmed/:id'
        })

        next()
    }

    fees(req, res, next) {
        res.send({
            data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.send
        })

        next()
    }

    showFee(req, res, next) {
        res.send({
            data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees[req.params.type]
        })

        next()
    }
}

module.exports = new TransactionsController
