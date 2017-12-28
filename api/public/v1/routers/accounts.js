const controllers = require('../controllers/accounts')
const schema = require('../schemas/accounts')

class AccountsRouter {
  register(registrar) {
    //registrar.get('accounts', controllers.index)
    registrar.get('accounts', controllers.show, schema.getAccount)
    registrar.get('accounts/getBalance', controllers.balance)
    registrar.get('accounts/getPublickey', controllers.publicKey, schema.getPublicKey)
    registrar.get('accounts/delegates/fee', controllers.fee)
    registrar.get('accounts/delegates', controllers.delegates)
    registrar.get('accounts/top', controllers.top)
    registrar.get('accounts/count', controllers.count)
  }
}

module.exports = new AccountsRouter()
