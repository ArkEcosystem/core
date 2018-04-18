'use strict';

const Sequelize = require('sequelize')
const Umzug = require('umzug')
const path = require('path')
const expandHomeDir = require('expand-home-dir')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

class Database {
  async init (config) {
    if (this.db) {
      throw new Error('Already initialised')
    }

    if (config.dialect === 'sqlite') {
      config.uri = 'sqlite:' + expandHomeDir(config.uri.substring(7))
    }

    this.db = new Sequelize(config.uri, {
      dialect: config.dialect,
      logging: !!config.logging,
      operatorsAliases: Sequelize.Op
    })

    try {
      await this.db.authenticate()
      await this.runMigrations()
      await this.registerModels()
    } catch (error) {
      logger.error('Unable to connect to the database:')
      logger.error(error.stack)
    }
  }

  runMigrations () {
    const umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.db
      },
      migrations: {
        params: [
          this.db.getQueryInterface(),
          Sequelize
        ],
        path: path.join(__dirname, 'migrations')
      }
    })

    return umzug.up()
  }

  registerModels () {
    this.model = this.db['import']('./model')
  }

  paginate (params) {
    return this.model.findAndCountAll(params)
  }

  findById (id) {
    return this.model.findById(id)
  }

  findByEvent (event) {
    return this.model.findAll({ where: {event} })
  }

  create (data) {
    return this.model.create(data)
  }

  async update (id, data) {
    try {
      const webhook = await this.model.findById(id)

      webhook.update(data)
    } catch (e) {
      return false
    }
  }

  async destroy (id) {
    try {
      const webhook = this.model.findById(id)

      webhook.destroy()
    } catch (e) {
      return false
    }
  }
}

module.exports = new Database()
