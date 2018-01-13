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

  paginate (pager, params = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.db.accountsTable.findAndCountAll(Object.assign(params, {
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
    })
  }
}

module.exports = DelegatesRepository
