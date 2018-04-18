'use strict';

const Sequelize = require('sequelize')
const Umzug = require('umzug')
const path = require('path')
const expandHomeDir = require('expand-home-dir')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

class Database {
  /**
   * [init description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  async init (config) {
    if (this.connection) {
      throw new Error('Already initialised')
    }

    if (config.dialect === 'sqlite') {
      config.uri = 'sqlite:' + expandHomeDir(config.uri.substring(7))
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
   * @return {[type]} [description]
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
   * @return {[type]} [description]
   */
  registerModels () {
    this.model = this.connection['import']('./model')
  }

  /**
   * [paginate description]
   * @param  {[type]} params [description]
   * @return {[type]}        [description]
   */
  paginate (params) {
    return this.model.findAndCountAll(params)
  }

  /**
   * [findById description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  findById (id) {
    return this.model.findById(id)
  }

  /**
   * [findByEvent description]
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
   */
  findByEvent (event) {
    return this.model.findAll({ where: {event} })
  }

  /**
   * [create description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  create (data) {
    return this.model.create(data)
  }

  /**
   * [update description]
   * @param  {[type]} id   [description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  async update (id, data) {
    try {
      const webhook = await this.model.findById(id)

      webhook.update(data)
    } catch (e) {
      return false
    }
  }

  /**
   * [destroy description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  async destroy (id) {
    try {
      const webhook = this.model.findById(id)

      webhook.destroy()
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
