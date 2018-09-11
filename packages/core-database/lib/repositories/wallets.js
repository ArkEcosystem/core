'use strict'

const filterRows = require('./utils/filter-rows')
const limitRows = require('./utils/limit-rows')
const orderBy = require('lodash/orderBy')

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
  all () {
    return this.connection.walletManager.all()
  }

  /**
   * Find all wallets.
   * @param  {Object} params
   * @return {Object}
   */
  findAll (params = {}) {
    const wallets = this.all()

    let [iteratee, order] = params.orderBy
      ? params.orderBy.split(':')
      : ['rate', 'asc']

    return {
      rows: limitRows(orderBy(wallets, iteratee, order), params),
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
    const wallets = this
      .all()
      .filter(wallet => wallet.vote === publicKey)

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
    return this.all().find(wallet => (wallet.address === id || wallet.publicKey === id || wallet.username === id))
  }

  /**
   * Count all wallets.
   * @return {Number}
   */
  count () {
    return this.all().length
  }

  /**
   * Find all wallets sorted by balance.
   * @param  {Object}  params
   * @return {Object}
   */
  top (params = {}) {
    const wallets = orderBy(this.all(), ['balance'], ['desc'])

    return {
      rows: limitRows(wallets, params),
      count: wallets.length
    }
  }

  /**
   * Search all wallets.
   * @param  {Object} [params]
   * @param  {Number} [params.limit] - Limit the number of results
   * @param  {Number} [params.offset] - Skip some results
   * @param  {Array} [params.orderBy] - Order of the results
   * @param  {String} [params.address] - Search by address
   * @param  {String} [params.publicKey] - Search by publicKey
   * @param  {String} [params.secondPublicKey] - Search by secondPublicKey
   * @param  {String} [params.username] - Search by username
   * @param  {String} [params.vote] - Search by vote
   * @param  {Object} [params.balance] - Search by balance
   * @param  {Number} [params.balance.from] - Search by balance (minimum)
   * @param  {Number} [params.balance.to] - Search by balance (maximum)
   * @param  {Object} [params.voteBalance] - Search by voteBalance
   * @param  {Number} [params.voteBalance.from] - Search by voteBalance (minimum)
   * @param  {Number} [params.voteBalance.to] - Search by voteBalance (maximum)
   * @return {Object}
   */
  search (params) {
    const wallets = filterRows(this.all(), params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'username', 'vote'],
      between: ['balance', 'voteBalance']
    })

    return {
      rows: limitRows(wallets, params),
      count: wallets.length
    }
  }
}
