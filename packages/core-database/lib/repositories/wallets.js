'use strict'

const _ = require('lodash')
const filterItems = require('./utils/filter-items')

const limitRows = (rows, params) => {
  if (params.hasOwnProperty('offset') || params.limit) {
    const offset = params.offset || 0
    const limit = params.limit ? offset + params.limit : rows.length
    return rows.slice(offset, limit)
  } else {
    return rows
  }
}
const wrapRows = rows => ({ count: rows.length, rows })

module.exports = class WalletsRepository {
  /**
   * Create a new wallet repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * Get all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  findAll (params = {}) {
    const wallets = this.connection.walletManager.getLocalWallets()
    return wrapRows(limitRows(wallets, params))
  }

  /**
   * Get all wallets for the given vote.
   * @param  {String} publicKey
   * @param  {Object} params
   * @return {Object}
   */
  findAllByVote (publicKey, params = {}) {
    const wallets = this.findAll().rows.filter(wallet => wallet.votes.includes(publicKey))
    return wrapRows(limitRows(wallets, params))
  }

  /**
   * Get a wallet by address, public key or username.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.findAll().rows.find(w => (w.address === id || w.publicKey === id || w.username === id))
  }

  /**
   * Count all wallets.
   * @return {Number}
   */
  count () {
    return this.findAll().count
  }

  /**
   * Get all wallets sorted by balance.
   * @param  {Object}  params
   * @return {Object}
   */
  top (params = {}) {
    const wallets = _.sortBy(this.findAll().rows, 'balance').reverse()
    return wrapRows(limitRows(wallets, params))
  }

  /**
   * Search all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  search (params) {
    let wallets = this.findAll().rows

    wallets = filterObject(wallets, params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'username', 'vote'],
      between: ['balance', 'votebalance']
    })

    return wrapRows(wallets)
  }
}
