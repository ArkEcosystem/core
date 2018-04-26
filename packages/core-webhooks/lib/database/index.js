'use strict';

const Sequelize = require('sequelize')
const Umzug = require('umzug')
const path = require('path')
const fs = require('fs-extra')
const expandHomeDir = require('expand-home-dir')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

class Database {
  /**
   * [init description]
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
      await this.runMigrations()
      await this.registerModels()
    } catch (error) {
      logger.error('Unable to connect to the database:')
      logger.error(error.stack)
    }
  }

  /**
   * [runMigrations description]
   * @return {Boolean}
   */
  runMigrations () {
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
   * [registerModels description]
   * @return {void}
   */
  registerModels () {
    this.model = this.connection['import']('./model')
  }

  /**
   * [paginate description]
   * @param  {Object} params
   * @return {Object}
   */
  paginate (params) {
    return this.model.findAndCountAll(params)
  }

  /**
   * [findById description]
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.model.findById(id)
  }

  /**
   * [findByEvent description]
   * @param  {String} event
   * @return {Array}
   */
  findByEvent (event) {
    return this.model.findAll({ where: {event} })
  }

  /**
   * [create description]
   * @param  {Object} data
   * @return {Object}
   */
  create (data) {
    return this.model.create(data)
  }

  /**
   * [update description]
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
   * [destroy description]
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
}

/**
 * [exports description]
 * @type {Database}
 */
module.exports = new Database()
