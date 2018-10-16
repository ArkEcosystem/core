'use strict'

const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Umzug = require('umzug')
const path = require('path')
const fs = require('fs-extra')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

class Database {
  /**
   * Set up the database connection.
   * @param  {Object} config
   * @return {void}
   */
  async setUp (config) {
    if (this.connection) {
      throw new Error('Webhooks database already initialised')
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
      // TODO no exit here?
      process.exit(1)
    }
  }

  /**
   * Paginate all webhooks.
   * @param  {Object} params
   * @return {Object}
   */
  paginate (params) {
    return this.model.findAndCountAll(params)
  }

  /**
   * Get a webhook for the given id.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.model.findById(id)
  }

  /**
   * Get all webhooks for the given event.
   * @param  {String} event
   * @return {Array}
   */
  findByEvent (event) {
    return this.model.findAll({ where: { event } })
  }

  /**
   * Store a new webhook.
   * @param  {Object} data
   * @return {Object}
   */
  create (data) {
    return this.model.create(data)
  }

  /**
   * Update the webhook for the given id.
   * @param  {Number} id
   * @param  {Object} data
   * @return {Boolean}
   */
  async update (id, data) {
    try {
      const webhook = await this.model.findById(id)

      webhook.update(data)

      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Destroy the webhook for the given id.
   * @param  {Number} id
   * @return {Boolean}
   */
  async destroy (id) {
    try {
      const webhook = await this.model.findById(id)

      webhook.destroy()

      return true
    } catch (e) {
      return false
    }
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
    this.model = this.connection['import']('./model')
  }
}

/**
 * @type {Database}
 */
module.exports = new Database()
