'use strict';

const Sequelize = require('sequelize')
const Umzug = require('umzug')
const path = require('path')
const fs = require('fs-extra')
const expandHomeDir = require('expand-home-dir')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

class Database {
  /**
   * Initialise the database connection.
   * @param  {Object} config
   * @return {void}
   */
  async init (config) {
    if (this.connection) {
      throw new Error('Already initialised')
    }

    if (config.dialect === 'sqlite') {
      const databasePath = expandHomeDir(config.uri.substring(7))

      config.uri = `sqlite:${databasePath}`

      await fs.ensureFile(databasePath)
    }

    this.connection = new Sequelize(config.uri, {
      dialect: config.dialect,
      logging: !!config.logging,
      operatorsAliases: Sequelize.Op
    })

    try {
      await this.connection.authenticate()
      await this.__runMigrations()
      await this.__registerModels()
    } catch (error) {
      logger.error('Unable to connect to the database', error.stack)
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
    return this.model.findAll({ where: {event} })
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
      const webhook = this.model.findById(id)

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
