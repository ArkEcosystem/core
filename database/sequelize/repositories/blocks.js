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
      if (!!queryParams[elem])
        whereStatement[elem] = queryParams[elem]
    }

    if (!!queryParams.orderBy) {
      orderBy.push(queryParams.orderBy.split(':'))
    }

    return this.db.blocksTable.findAndCountAll({
      where: whereStatement,
      order: orderBy,
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100)
    })
  }

  paginateByGenerator (generatorPublicKey, page, perPage) {
    return this.paginate(page, perPage, {
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
}

module.exports = BlocksRepository
