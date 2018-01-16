const Op = require('sequelize').Op

class AccountsRepository {
  constructor (db) {
    this.db = db
  }

  all (queryParams) {
    return this.db.accountsTable.findAndCountAll({
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100)
    })
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

  count () {
    return this.db.accountsTable.count()
  }

  top (queryParams) {
    return this.db.accountsTable.findAndCountAll({
      attributes: ['address', 'balance', 'publicKey'],
      order: [['balance', 'DESC']],
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100)
    })
  }

  // Helper methods
  getProducedBlocks (publicKey) {
    return this.db.blocksTable.count({
      where: {
        generatorPublicKey: publicKey
      }
    })
  }
}

module.exports = AccountsRepository
