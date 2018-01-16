const Op = require('sequelize').Op
const moment = require('moment')
const cache = requireFrom('core/cache')

class TransactionsRepository {
  constructor (db) {
    this.db = db
  }

  all (queryParams) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['type', 'senderPublicKey', 'vendorField', 'senderId', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (queryParams[elem]) { whereStatement[elem] = queryParams[elem] }
    }

    if (queryParams.orderBy) {
      let order = queryParams.orderBy.split(':')
      if (['timestamp', 'type', 'amount'].includes(order[0])) {
        orderBy.push(queryParams.orderBy.split(':'))
      }
    }

    return this.db.transactionsTable.findAndCountAll({
      where: whereStatement,
      order: orderBy,
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100),
      include: {
        model: this.db.blocksTable,
        attributes: ['height']
      }
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

  paginateAllByWallet (wallet, pager) {
    const cacheKey = cache.generateKey(`transactions/senderPublicKey:${wallet.publicKey}/recipientId:${wallet.address}`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

    return this.paginate(pager, {
      where: {
        [Op.or]: [{
          senderPublicKey: wallet.publicKey
        }, {
          recipientId: wallet.address
        }]
      }
    }).then(res => {
        cache.setKey(cacheKey, res);

        return res;
      })
    })
  }

  paginateAllBySender (senderPublicKey, pager) {
    const cacheKey = cache.generateKey(`transactions/senderPublicKey:${senderPublicKey}`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

    return this.paginate(pager, {
      where: {
          senderPublicKey: senderPublicKey
      }
    }).then(res => {
        cache.setKey(cacheKey, res);

        return res;
      })
    })
  }

  paginateAllByRecipient (recipientId, pager) {
    const cacheKey = cache.generateKey(`transactions/recipientId:${recipientId}`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

    return this.paginate(pager, {
      where: {
        recipientId: recipientId
      }
    }).then(res => {
        cache.setKey(cacheKey, res);

        return res;
      })
    })
  }

  paginateVotesBySender (senderPublicKey, pager) {
    const cacheKey = cache.generateKey(`transactions/senderPublicKey:${senderPublicKey}/type:3`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

    return this.paginate(pager, {
      where: {
        senderPublicKey: senderPublicKey,
        type: 3
      }
    }).then(res => {
        cache.setKey(cacheKey, res);

        return res;
      })
    })
  }

  paginateByBlock (blockId, pager) {
    const cacheKey = cache.generateKey(`transactions/blockId:${blockId}`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

    return this.paginate(pager, {
      where: {
        blockId: blockId
      }
    }).then(res => {
        cache.setKey(cacheKey, res);

        return res;
      })
    })
  }

  paginateByType (type, pager) {
    const cacheKey = cache.generateKey(`transactions/type:${type}`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

    return this.paginate(pager, {
      where: {
        type: type
      }
    }).then(res => {
        cache.setKey(cacheKey, res);

        return res;
      })
    })
  }

  findById (id) {
    const cacheKey = cache.generateKey(`transactions/id:${id}`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

      return this.db.transactionsTable.findById(id).then(res => {
        cache.setKey(cacheKey, res);

        return res;
      })
    })
  }

  findByIdAndType (id, type) {
    const cacheKey = cache.generateKey(`transactions/id:${id}/type:${type}`)

    return cache.getKey(cacheKey).then((data) => {
      if (data) return data

      return this.db.transactionsTable.findOne({
        where: {
          id: id,
          type: type
        }
      }).then(res => {
          cache.setKey(cacheKey, res);

          return res;
        })
      })
  }

  allByDateAndType (type, from, to) {
    const cacheKey = cache.generateKey(`statistics/transactions/from:${from}/to:${to}`)

    return cache.get(cacheKey).then((data) => {
      if (data) return data

    return this.db.transactionsTable.findAndCountAll({
      attributes: ['amount', 'fee'],
      where: {
        type: type,
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

module.exports = TransactionsRepository
