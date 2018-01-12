const Sequelize = require('sequelize')
const Op = require('sequelize').Op


class AccountsRepository {
  constructor(db) {
    this.db = db
  }

  all(queryParams) {
    return this.db.accountsTable.findAndCountAll({
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100)
    })
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

  count(){
    return this.db.accountsTable.count()
  }

  top(queryParams){
    return this.db.accountsTable.findAndCountAll({
      attributes: ['address', 'balance', 'publicKey'],
      order: [['balance', 'DESC']],
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100)
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
