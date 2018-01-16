const Op = require('sequelize').Op
const moment = require('moment')
const cache = requireFrom('core/cache')

class BlocksRepository {
  constructor (db) {
    this.db = db
  }

  all (queryParams) {
    const cacheKey = cache.generateKey(Object.assign(queryParams, { resource: 'blocks' }))

    return cache.get(cacheKey).then((data) => {
      if (data) return data

      let whereStatement = {}
      let orderBy = []

      const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']
      for (const elem of filter) {
        if (queryParams[elem]) {
          whereStatement[elem] = queryParams[elem]
        }
      }

      if (queryParams.orderBy) {
        orderBy.push(queryParams.orderBy.split(':'))
      }

      return this.db.blocksTable.findAndCountAll({
        where: whereStatement,
        order: orderBy,
        offset: parseInt(queryParams.offset || 1),
        limit: parseInt(queryParams.limit || 100)
      }).then(res => {
        cache.set(cacheKey, res); return res;
      })
    })
  }

  paginate (pager, queryParams = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.all(Object.assign(queryParams, {
      offset: offset,
      limit: pager.perPage
    }))
  }

  paginateByGenerator (generatorPublicKey, pager) {
    return this.paginate(pager, {
      where: {
        generatorPublicKey: generatorPublicKey
      }
    })
  }

  findById (id) {
    const cacheKey = cache.generateKey({ resource: 'blocks', id })

    return cache.get(cacheKey).then((data) => {
      if (data) return data

      return this.db.blocksTable.findById(id).then(res => {
        cache.set(cacheKey, res);

        return res;
      })
    })
  }

  findLastByPublicKey (publicKey) {
    const cacheKey = cache.generateKey({ resource: 'blocks', publicKey })

    return cache.get(cacheKey).then((data) => {
      if (data) return data

      return this.db.blocksTable.findOne({
        limit: 1,
        where: { generatorPublicKey: publicKey },
        order: [[ 'createdAt', 'DESC' ]]
      }).then(res => {
        cache.set(cacheKey, res);

        return res;
      })
    })
  }

  allByDateTimeRange (from, to) {
    const cacheKey = cache.generateKey({ resource: 'blocks', from, to })

    return cache.get(cacheKey).then((data) => {
      if (data) return data

      return this.db.blocksTable.findAndCountAll({
        attributes: ['totalFee', 'reward'],
        where: {
          createdAt: {
            [Op.lte]: moment(to).endOf('day').toDate(),
            [Op.gte]: moment(from).startOf('day').toDate()
          }
        }
      }).then(res => {
        cache.set(cacheKey, res);

        return res;
      })
    })
  }
}

module.exports = BlocksRepository
