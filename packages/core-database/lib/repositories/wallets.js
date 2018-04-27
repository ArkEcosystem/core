'use strict';

const _ = require('lodash')
const filterObject = require('./utils/filter-object')

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
  async findAll (params = {}) {
    const wallets = this.connection.walletManager.getLocalWallets()

    return Object.keys(params).length ? {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    } : wallets
  }

  /**
   * Paginate all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  async paginate (params = {}) {
    const wallets = await this.findAll()

    return {
      count: wallets.length,
      rows: wallets.slice(params.offset, params.offset + params.limit)
    }
  }

  /**
   * Get all wallets for the given vote.
   * @param  {String} publicKey
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByVote (publicKey, params = {}) {
    let wallets = await this.findAll()
    wallets = await wallets.filter(a => a.vote === publicKey)

    return Object.keys(params).length ? {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    } : wallets
  }

  /**
   * Get a wallet.
   * @param  {Number} id
   * @return {Object}
   */
  async findById (id) {
    const wallets = await this.findAll()

    return wallets.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  /**
   * Count all wallets.
   * @return {Number}
   */
  async count () {
    const wallets = await this.findAll()

    return wallets.length
  }

  /**
   * Get all wallets sorted by balance.
   * @param  {Object}  params
   * @param  {Boolean} legacy
   * @return {Object}
   */
  async top (params, legacy = false) {
    let wallets = await this.findAll()

    wallets = _.sortBy(wallets, 'balance').reverse()
    wallets = wallets.slice(params.offset, params.offset + params.limit)

    return legacy ? wallets : {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    }
  }

  /**
   * Search all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  async search (params) {
    let wallets = await this.findAll()

    wallets = await filterObject(wallets, params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'vote', 'username'],
      between: ['balance', 'votebalance']
    })

    return {
      count: wallets.length,
      rows: wallets
    }
  }
}
