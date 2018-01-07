const Sequelize = require('sequelize')
const Op = require('sequelize').Op
const blockchain = requireFrom('core/blockchainManager')


class AccountsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.accountsTable.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.all(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.accountsTable.findOne({
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

  //Helper methods
  getProducedBlocks(publicKey){
    return this.db.blocksTable.count({
        where: {
          generatorPublicKey: publicKey
        }
      })

  }
}

module.exports = AccountsRepository
