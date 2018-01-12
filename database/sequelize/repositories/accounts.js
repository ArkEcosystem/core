const Op = require('sequelize').Op

class AccountsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.accountsTable.findAndCountAll(params)
  }

  paginate(page, perPage, params = {}) {
    let offset = 0

    if (page > 1) {
      offset = page * perPage
    }

    return this.all(Object.assign(params, {
      offset: offset,
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
}

module.exports = AccountsRepository
