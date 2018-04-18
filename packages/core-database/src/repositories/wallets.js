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
   * @param  {[type]} db [description]
   * @return {[type]}    [description]
   */
  constructor (db) {
    this.db = db
  }

/**
 * [findAll description]
 * @param  {Object} params [description]
 * @return {[type]}        [description]
 */
  async findAll (params = {}) {
    const wallets = this.db.walletManager.getLocalWallets()

    return Object.keys(params).length ? {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    } : wallets
  }

  /**
   * [paginate description]
   * @param  {Object} params [description]
   * @return {[type]}        [description]
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
   * @param  {[type]} publicKey [description]
   * @param  {Object} params    [description]
   * @return {[type]}           [description]
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
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  async findById (id) {
    const wallets = await this.findAll()

    return wallets.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  /**
   * [count description]
   * @return {[type]} [description]
   */
  async count () {
    const wallets = await this.findAll()

    return wallets.length
  }

  /**
   * [top description]
   * @param  {[type]}  params [description]
   * @param  {Boolean} legacy [description]
   * @return {[type]}         [description]
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
   * @param  {[type]} params [description]
   * @return {[type]}        [description]
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
