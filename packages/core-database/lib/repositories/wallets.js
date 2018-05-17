'use strict'

const _ = require('lodash')
const filterObject = require('./utils/filter-object')

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
    let wallets = this.connection.walletManager.getLocalWallets()

    if (!Object.keys(params).length) {
      return wallets
    }

    let returnWallets = wallets

    if (params.hasOwnProperty('offset') && params.limit) {
      returnWallets = returnWallets.slice(params.offset, params.offset + params.limit)
    }

    return {
      count: wallets.length,
      rows: returnWallets
    }
  }

  /**
   * Get all wallets for the given vote.
   * @param  {String} publicKey
   * @param  {Object} params
   * @return {Object}
   */
  findAllByVote (publicKey, params = {}) {
    let wallets = this.findAll().filter(wallet => (wallet.vote === publicKey))

    if (!Object.keys(params).length) {
      return wallets
    }

    let returnWallets = wallets

    if (params.hasOwnProperty('offset') && params.limit) {
      returnWallets = returnWallets.slice(params.offset, params.offset + params.limit)
    }

    return {
      count: wallets.length,
      rows: returnWallets
    }
  }

  /**
   * Get a wallet by address, public key or username.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.findAll().find(w => (w.address === id || w.publicKey === id || w.username === id))
  }

  /**
   * Count all wallets.
   * @return {Number}
   */
  count () {
    return this.findAll().length
  }

  /**
   * Get all wallets sorted by balance.
   * @param  {Object}  params
   * @return {Object}
   */
  top (params = {}) {
    let wallets = _.sortBy(this.findAll(), 'balance').reverse()

    if (params.hasOwnProperty('offset') || params.limit) {
      const offset = params.offset || 0
      const limit = params.limit ? offset + params.limit : -1
      wallets = wallets.slice(offset, limit)
    }

    return wrapRows(wallets)
  }

  /**
   * Search all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  search (params) {
    const wallets = filterObject(this.findAll(), params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'vote', 'username'],
      between: ['balance', 'votebalance']
    })

    let returnWallets = wallets

    if (params.hasOwnProperty('offset') && params.limit) {
      returnWallets = returnWallets.slice(params.offset, params.offset + params.limit)
    }

    return {
      count: wallets.length,
      rows: returnWallets
    }
  }
}
