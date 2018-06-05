'use strict'

const _ = require('lodash')
const filterRows = require('./utils/filter-rows')
const limitRows = require('./utils/limit-rows')

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
    const wallets = this.getLocalWallets()
    return {
      rows: limitRows(wallets, params),
      count: wallets.length
    }
  }

  /**
   * Find all wallets for the given vote.
   * @param  {String} publicKey
   * @param  {Object} params
   * @return {Object}
   */
  findAllByVote (publicKey, params = {}) {
    const wallets = this.getLocalWallets().filter(wallet => wallet.vote === publicKey)
    return {
      rows: limitRows(wallets, params),
      count: wallets.length
    }
  }

  /**
   * Find a wallet by address, public key or username.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.getLocalWallets().find(wallet => (wallet.address === id || wallet.publicKey === id || wallet.username === id))
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
    return {
      rows: limitRows(wallets, params),
      count: wallets.length
    }
  }

  /**
   * Search all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  search (params) {
    const wallets = filterRows(this.getLocalWallets(), params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'username', 'vote'],
      between: ['balance', 'votebalance']
    })

    return {
      rows: limitRows(wallets, params),
      count: wallets.length
    }
  }
}
