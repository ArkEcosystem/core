const Op = require('sequelize').Op

class AccountsRepository {
  constructor (db) {
    this.db = db
  }

  all (params = {}) {
    return this.db.accountsTable.findAndCountAll(params)
  }

  paginate (pager, params = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.all(Object.assign(params, {
      offset: offset,
      limit: pager.perPage
    }))
  }

  paginateByVote (publicKey, pager) {
    return this.paginate(pager, {
      where: {
        vote: publicKey
      }
    })
  }

  findById (id) {
    return this.db.accountsTable.findOne({
      where: {
        [Op.or]: [{
          address: id
        }, {
          publicKey: id
        }, {
          username: id
        }]
      }
    })
  }
}

module.exports = AccountsRepository
