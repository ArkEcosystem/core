const Op = require('sequelize').Op
const cache = requireFrom('core/cache')

class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  all (params = {}) {
    let where = Object.assign(params.where, {
      username: {
        [Op.ne]: null
      }
    })

    return this.db.accountsTable.findAndCountAll(Object.assign(params, {
      where: where
    }))
  }

  paginate (pager, queryParams = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.db.accountsTable.findAndCountAll(Object.assign(queryParams, {
      where: {
        username: {
          [Op.ne]: null
        }
      },
      offset: offset,
      limit: pager.perPage
    }))
  }

  findById (id) {
    const cacheKey = cache.generateKey(`delegates/id:${id}`)

    return cache.get(cacheKey).then((data) => {
      if (data) return data

      return this.db.accountsTable.findOne({
        where: {
          username: {
            [Op.ne]: null
          },
          [Op.or]: [{
            address: id
          }, {
            publicKey: id
          }, {
            username: id
          }]
        }
      }).then(res => {
        cache.set(cacheKey, res);

        return res;
      })
    })
  }
}

module.exports = DelegatesRepository
