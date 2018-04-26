'use strict';

const _ = require('lodash')
const filterObject = require('./utils/filter-object')

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class WalletsRepository {
  /**
   * [constructor description]
   * @param  {ConnectionInterface} connection
   * @return {void}
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
    const wallets = this.connection.walletManager.getLocalWallets()

    return Object.keys(params).length ? {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    } : wallets
  }

  /**
   * [paginate description]
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
   * [findAllByVote description]
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
   * [findById description]
   * @param  {Number} id
   * @return {Object}
   */
  async findById (id) {
    const wallets = await this.findAll()

    return wallets.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  /**
   * [count description]
   * @return {Number}
   */
  async count () {
    const wallets = await this.findAll()

    return wallets.length
  }

  /**
   * [top description]
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
   * [search description]
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
