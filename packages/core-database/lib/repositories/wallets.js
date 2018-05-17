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
   * Get all local wallets.
   * @return {Array}
   */
  getLocalWallets () {
    return this.connection.walletManager.getLocalWallets()
  }

  /**
   * Find all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  findAll (params = {}) {
    return wrapRows(limitRows(this.getLocalWallets(), params))
  }

  /**
   * Find all wallets for the given vote.
   * @param  {String} publicKey
   * @param  {Object} params
   * @return {Object}
   */
  findAllByVote (publicKey, params = {}) {
    const wallets = this.getLocalWallets().filter(wallet => wallet.votes.includes(publicKey))
    return wrapRows(limitRows(wallets, params))
  }

  /**
   * Find a wallet by address, public key or username.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.getLocalWallets().find(w => (w.address === id || w.publicKey === id || w.username === id))
  }

  /**
   * Count all wallets.
   * @return {Number}
   */
  count () {
    return this.getLocalWallets().length
  }

  /**
   * Find all wallets sorted by balance.
   * @param  {Object}  params
   * @return {Object}
   */
  top (params = {}) {
    const wallets = _.sortBy(this.getLocalWallets(), 'balance').reverse()
    return wrapRows(limitRows(wallets, params))
  }

  /**
   * Search all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  search (params) {
    let wallets = this.getLocalWallets()

    wallets = filterObject(wallets, params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'username', 'vote'],
      between: ['balance', 'votebalance']
    })

    return wrapRows(wallets)
  }
}
