'use strict';

const { calculateApproval, calculateProductivity } = require('./utils/delegate-calculator')

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class DelegatesRepository {
  /**
   * [constructor description]
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * [findAll description]
   * @param  {Object} params
   * @return {Object}
   */
  async findAll (params = {}) {
    return this.connection.walletManager.getLocalWallets().filter(a => !!a.username)
  }

  /**
   * [paginate description]
   * @param  {Object} params
   * @return {Object}
   */
  async paginate (params) {
    const delegates = await this.findAll()

    return {
      rows: delegates.slice(params.offset, params.offset + params.limit),
      count: delegates.length
    }
  }

  /**
   * [search description]
   * @param  {Object} params
   * @return {Object}
   */
  async search (params) {
    let delegates = await this.findAll()
    delegates = delegates.filter((delegate) => delegate.username.indexOf(params.q) > -1)

    if (params.orderBy) {
      const orderByField = params.orderBy.split(':')[0]
      const orderByDirection = params.orderBy.split(':')[1] || 'desc'

      delegates = delegates.sort((a, b) => {
        if (orderByDirection === 'desc' && (a[orderByField] < b[orderByField])) return -1
        if (orderByDirection === 'asc' && (a[orderByField] > b[orderByField])) return 1

        return 0
      })
    }

    return {
      rows: delegates.slice(params.offset, params.offset + params.limit),
      count: delegates.length
    }
  }

  /**
   * [findById description]
   * @param  {String} id
   * @return {Object}
   */
  async findById (id) {
    const delegates = await this.findAll()

    return delegates.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  /**
   * [active description]
   * @param  {Number} height
   * @param  {Number} totalSupply
   * @return {Array}
   */
  async active (height, totalSupply) {
    const delegates = await this.connection.getActiveDelegates(height)

    return Promise.all(delegates.map(async delegate => {
      const wallet = await this.connection.wallets.findById(delegate.publicKey)

      return {
        username: wallet.username,
        approval: calculateApproval(delegate, height),
        productivity: calculateProductivity(wallet)
      }
    }))
  }
}
