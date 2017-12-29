const Op = require('sequelize').Op

class AccountsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.accounts.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.all(Object.assign(params, {
      offset: page * perPage,
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
}

module.exports = AccountsRepository
