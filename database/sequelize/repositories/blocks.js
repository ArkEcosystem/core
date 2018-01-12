const Op = require('sequelize').Op
const moment = require('moment')

class BlocksRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.blocksTable.findAndCountAll(params)
  }

  paginate(pager, params = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.db.blocksTable.findAndCountAll(Object.assign(params, {
      offset: offset,
      limit: pager.perPage,
    }))
  }

  paginateByGenerator(generatorPublicKey, page, perPage) {
    return this.paginate(page, perPage, {
      where: {
        generatorPublicKey: generatorPublicKey
      }
    })
  }

  findById(id) {
    return this.db.blocksTable.findById(id)
  }

  findLastByPublicKey(publicKey) {
    return this.db.blocksTable.findOne({
      limit: 1,
      where: { generatorPublicKey: publicKey },
      order: [ [ 'createdAt', 'DESC' ]]
    })
  }

  allByDateTimeRange(from, to) {
    return this.db.blocksTable.findAndCountAll({
      attributes: ['totalFee', 'reward'],
      where: {
        createdAt: {
          [Op.lte]: moment(to).endOf('day').toDate(),
          [Op.gte]: moment(from).startOf('day').toDate(),
        }
      }
    })
  }
}

module.exports = BlocksRepository
