const blockchain = requireFrom('core/blockchainManager')
const Op = require('sequelize').Op

class DelegatesRepository {
  constructor() {
    this.db = blockchain.getInstance().getDb()
  }

  all(params = {}) {
    let where = Object.assign(params.where, {
      username: {
        [Op.ne]: null
      },
    })

    return this.db.accounts.findAndCountAll(Object.assign(params, {
      where: where
    }))
  }

  paginate(params, page, perPage) {
    return this.db.accounts.findAndCountAll(Object.assign(params, {
      where: {
        username: {
          [Op.ne]: null
        },
      },
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.accounts.findOne({
      where: {
        username: {
          [Op.ne]: null
        },
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
}

module.exports = new DelegatesRepository
