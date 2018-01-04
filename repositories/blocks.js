const blockchain = requireFrom('core/blockchainManager')

class BlocksRepository {
  constructor() {
    this.db = blockchain.getInstance().getDb()
  }

  all(params = {}) {
    return this.db.blocks.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.db.blocks.findAndCountAll(Object.assign(params, {
      offset: page > 1 ? page * perPage : 0,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.blocks.findById(id)
  }
}

module.exports = new BlocksRepository
