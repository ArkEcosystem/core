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

    return this.db.accountstable.findAndCountAll(Object.assign(params, {
      where: where
    }))
  }

  paginate(params, page, perPage) {
    return this.db.accountstable.findAndCountAll(Object.assign(params, {
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
    return this.db.accountstable.findOne({
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
