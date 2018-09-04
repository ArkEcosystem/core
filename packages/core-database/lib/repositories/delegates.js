'use strict'

const { calculateApproval, calculateProductivity } = require('./utils/delegate-calculator')
const limitRows = require('./utils/limit-rows')
const orderBy = require('lodash/orderBy')

module.exports = class DelegatesRepository {
  /**
   * Create a new delegate repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * Get all local delegates.
   * @return {Array}
   */
  getLocalDelegates () {
    return this.connection.walletManager.all().filter(wallet => !!wallet.username)
  }

  /**
   * Find all delegates.
   * @param  {Object} params
   * @return {Object}
   */
  findAll (params = {}) {
    const rows = this.getLocalDelegates()

    const order = params.orderBy
      ? params.orderBy.split(':')
      : ['rate', 'asc']

    return {
      rows: limitRows(orderBy(rows, order), params),
      count: rows.length
    }
  }

  /**
   * Paginate all delegates.
   * @param  {Object} params
   * @return {Object}
   */
  paginate (params) {
    return this.findAll(params)
  }

  /**
   * Search all delegates.
   * TODO Currently it searches by username only
   * @param  {Object} [params]
   * @param  {String} [params.username] - Search by username
   * @return {Object}
   */
  search (params) {
    let delegates = this.getLocalDelegates().filter(delegate => {
      return delegate.username.indexOf(params.username) > -1
    })

    if (params.orderBy) {
      const orderByField = params.orderBy.split(':')[0]
      const orderByDirection = params.orderBy.split(':')[1] || 'desc'

      delegates = delegates.sort((a, b) => {
        if (orderByDirection === 'desc' && (a[orderByField] < b[orderByField])) {
          return -1
        }

        if (orderByDirection === 'asc' && (a[orderByField] > b[orderByField])) {
          return 1
        }

        return 0
      })
    }

    return {
      rows: limitRows(delegates, params),
      count: delegates.length
    }
  }

  /**
   * Find a delegate.
   * @param  {String} id
   * @return {Object}
   */
  findById (id) {
    return this.getLocalDelegates().find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  /**
   * Find all active delegates at height.
   * @param  {Number} height
   * @return {Array}
   */
  getActiveAtHeight (height) {
    const delegates = this.connection.getActiveDelegates(height)

    return delegates.map(delegate => {
      const wallet = this.connection.wallets.findById(delegate.publicKey)

      return {
        username: wallet.username,
        approval: calculateApproval(delegate, height),
        productivity: calculateProductivity(wallet)
      }
    })
  }
}
