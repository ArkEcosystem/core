const Op = require('sequelize').Op
const moment = require('moment')

class BlocksRepository {
  constructor (db) {
    this.db = db
  }

  all (queryParams) {
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
    return this.db.blocksTable.findById(id)
  }

  findLastByPublicKey (publicKey) {
    return this.db.blocksTable.findOne({
      limit: 1,
      where: { generatorPublicKey: publicKey },
      order: [[ 'createdAt', 'DESC' ]]
    })
  }

  allByDateTimeRange (from, to) {
    return this.db.blocksTable.findAndCountAll({
      attributes: ['totalFee', 'reward'],
      where: {
        createdAt: {
          [Op.lte]: moment(to).endOf('day').toDate(),
          [Op.gte]: moment(from).startOf('day').toDate()
        }
      }
    })
  }

  search(queryParams) {
    let where = {}

    const exactFilters = ['version', 'previousBlock', 'payloadHash', 'generatorPublicKey', 'blockSignature']
    const betweenFilters = ['id', 'createdAt', 'timestamp', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength']
    for (const elem of exactFilters) {
      if (queryParams[elem]) {
        where[elem] = queryParams[elem]
      }
    }
    for (const elem of betweenFilters) {
      if (!queryParams[elem]) {
        continue;
      }
      if (!queryParams[elem].from && !queryParams[elem].to) {
        where[elem] = queryParams[elem]
      } else if (queryParams[elem].from || queryParams[elem].to) {
        where[elem] = {}
        if (queryParams[elem].from) {
          if (elem === 'createdAt') {
            where[Op.gte] = moment(queryParams[elem].from).endOf('day').toDate()
          } else {
            where[Op.gte] = queryParams[elem].from
          }
        }
        if (queryParams[elem].to) {
          if (elem === 'createdAt') {
            where[Op.lte] = moment(queryParams[elem].to).endOf('day').toDate()
          } else {
            where[Op.lte] = queryParams[elem].to
          }
        }
      }
    }

    console.log('WHERE', where);

    return this.db.blocksTable.findAndCountAll({
      where
    })
  }
}

module.exports = BlocksRepository
