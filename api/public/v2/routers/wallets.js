const controllers = require('../controllers/wallets')

class WalletsRouter {
    register(registrar) {
        registrar.get('wallets', controllers.index)
        registrar.post('wallets/search', controllers.search)
        registrar.get('wallets/:id', controllers.show)
        registrar.get('wallets/:id/transactions', controllers.transactions)
        registrar.get('wallets/:id/votes', controllers.votes)
    }
}

module.exports = new WalletsRouter
