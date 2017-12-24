const blockchain = require(__root + 'core/blockchainManager')
const Sequelize = require('sequelize')
const Op = Sequelize.Op;

class BlocksRepository {
  constructor() {
    this.db = blockchain.getInstance().getDb()
  }

  all(params = {}) {
    return this.db.blocks.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.db.blocks.findAndCountAll(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.blocks.findById(id)
  }
}

module.exports = new BlocksRepository
