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

    return this.db.accounts.findAndCountAll(Object.assign(params, {
      where: where
    }))
  }

  paginate(params, page, perPage) {
    let offset = 0

    if (page > 1) {
      offset = page * perPage
    }

    return this.db.accounts.findAndCountAll(Object.assign(params, {
      where: {
        username: {
          [Op.ne]: null
        },
      },
      offset: offset,
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

module.exports = DelegatesRepository
