'use strict'

const { calculateApproval, calculateProductivity } = require('./utils/delegate-calculator')

module.exports = class DelegatesRepository {
  /**
   * Create a new delegate repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * Get all delegates.
   * @param  {Object} params
   * @return {Object}
   */
  findAll (params = {}) {
    return this.connection.walletManager.getLocalWallets().filter(wallet => !!wallet.username)
  }

  /**
   * Paginate all delegates.
   * @param  {Object} params
   * @return {Object}
   */
  paginate (params) {
    const delegates = this.findAll().slice(params.offset, params.offset + params.limit)

    return {
      count: delegates.length,
      rows: delegates
    }
  }

  /**
   * Search all delegates.
   * @param  {Object} params
   * @return {Object}
   */
  search (params) {
    let delegates = this.findAll().filter((delegate) => delegate.username.indexOf(params.q) > -1)

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

    if (params.offset && params.limit) {
      delegates = delegates.slice(params.offset, params.offset + params.limit)
    }

    return {
      count: delegates.length,
      rows: delegates
    }
  }

  /**
   * Get a delegate.
   * @param  {String} id
   * @return {Object}
   */
  findById (id) {
    const delegates = this.findAll()

    return delegates.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  /**
   * Get all active delegates at height.
   * @param  {Number} height
   * @return {Array}
   */
  getActiveAtHeight (height) {
    const delegates = this.connection.getActiveDelegates(height)

    return Promise.all(delegates.map(delegate => {
      const wallet = this.connection.wallets.findById(delegate.publicKey)

      return {
        username: wallet.username,
        approval: calculateApproval(delegate, height),
        productivity: calculateProductivity(wallet)
      }
    }))
  }
}
