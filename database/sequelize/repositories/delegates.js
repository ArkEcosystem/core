const Sequelize = require('sequelize')
const Op = require('sequelize').Op
const arkjs = require('arkjs')
const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const logger = requireFrom('core/logger')
const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const crypto = require('crypto')

class DelegatesRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    const that = this
    this.delegates = {}
    return this.db.accountsTable
      .findAll({
        attributes: [
          ['vote', 'publicKey'],
          [Sequelize.fn('SUM', Sequelize.col('balance')), 'balance']
        ],
        group: 'vote',
        where: {
          vote: {
            [Sequelize.Op.ne]: null
          }
        }
      })
      .then(data => {
        // logger.info(`got ${data.length} voted delegates`)
        that.delegates = data
          .sort((a, b) => b.balance - a.balance)
        logger.debug(`Found ${that.delegates.length} active delegates`)
        return Promise.resolve(that.delegates)
      })
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
