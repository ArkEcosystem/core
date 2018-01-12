const Op = require('sequelize').Op

class DelegatesRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    let where = Object.assign(params.where, {
      username: {
        [Op.ne]: null
      },
    })

    return this.db.accountsTable.findAndCountAll(Object.assign(params, {
      where: where
    }))
  }

  paginate(pager, params = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.db.accountsTable.findAndCountAll(Object.assign(params, {
      where: {
        username: {
          [Op.ne]: null
        },
      },
      offset: offset,
      limit: pager.perPage,
    }))
  }

  findById(id) {
    return this.db.accountsTable.findOne({
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

module.exports = DelegatesRepository
