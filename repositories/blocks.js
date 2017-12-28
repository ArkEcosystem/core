const blockchain = requireFrom('core/blockchainManager')
const Op = require('sequelize').Op

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
