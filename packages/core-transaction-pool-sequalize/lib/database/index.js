'use strict'

const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Umzug = require('umzug')
const path = require('path')
const fs = require('fs-extra')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')
const { slots } = require('@arkecosystem/crypto')

class Database {
  /**
   * Set up the database connection.
   * @param  {Object} config
   * @return {void}
   */
  async setUp (config) {
    if (this.connection) {
      throw new Error('Transaction pool database already initialized')
    }

    if (config.dialect === 'sqlite' && config.storage !== ':memory:') {
      await fs.ensureFile(config.storage)
    }

    this.connection = new Sequelize({
      ...config,
      ...{ operatorsAliases: Op }
    })

    try {
      await this.connection.authenticate()
      await this.__runMigrations()
      await this.__registerModels()
    } catch (error) {
      logger.error('Unable to connect to the database', error.stack)
      process.exit(1)
    }

    return this
  }

  async disconnect () {
    await this.connection.close()
  }

  findById (id) {
    return this.model.findById(id)
  }

  findByIds (ids) {
    return this.model.findAll({ where: {id: ids} })
  }

  /**
   * Get the number of transaction in the pool from specific sender
   * @param {String} senderPublicKey
   * @returns {Number}
   */
  getSenderSize (senderPublicKey) {
    return this.model.count({ where: {senderPublicKey: senderPublicKey} })
  }

  /**
  * Checks if transaction exists in the pool
  * @param {transactionId}
  * @return {Boolean}
  */
  async transactionExists (id) {
    const count = await this.model.count({ where: {id: id} })
    return (count > 0)
  }

  deleteById (id) {
    return this.model.destroy({ where: {id: id} })
  }

  deleteBySender (senderPublicKey) {
    return this.model.destroy({ where: {senderPublicKey: senderPublicKey} })
  }

  add (data) {
    return this.model.create(data)
  }

  async getExpiredTransactionIds () {
    const transactions = await this.model.findAll({
      where: {
        created_at: { [Op.gte]: slots.getTime() }
      },
      attributes: ['id']
    })
    return transactions.map(transaction => transaction.id)
  }

  /**
   * Run all migrations.
   * @return {Boolean}
   */
  __runMigrations () {
    const umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.connection
      },
      migrations: {
        params: [
          this.connection.getQueryInterface(),
          Sequelize
        ],
        path: path.join(__dirname, 'migrations')
      }
    })

    return umzug.up()
  }

  /**
   * Register all models.
   * @return {void}
   */
  __registerModels () {
    this.model = this.connection.import('./model')
  }
}

/**
 * @type {Database}
 */
module.exports = new Database()
