const blockchain = requireFrom('core/blockchainManager')
const Op = require('sequelize').Op

class AccountsRepository {
  constructor() {
    this.db = blockchain.getInstance().getDb()
  }

  all(params = {}) {
    return this.db.accounts.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.all(Object.assign(params, {
      offset: page > 1 ? page * perPage : 0,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.accounts.findOne({
      where: {
        [Op.or]: [{
          address: id,
        }, {
          publicKey: id,
        }, {
          username: id,
        }]
      }
    })
  }

  // TODO - update
  findDelegate(vote) {
    return this.db.getActiveDelegates (blockchain.getInstance().lastBlock.data.height)
    /*.then(delegates => {
      var o2 = delegates.find(function (obj) { return obj.publicKey === vote })
      return Promise.resolve(o2)
    })*/
  }
}

module.exports = new AccountsRepository
