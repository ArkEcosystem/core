'use strict';

const fs = require('fs')
const path = require('path')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const provider = require('./provider')

/**
 * [description]
 * @return {[type]} [description]
 */
const listRepositories = () => {
  const repositories = {}

  let directory = path.resolve(__dirname, './repositories')

  fs.readdirSync(directory).forEach(file => {
    if (file.indexOf('.js') !== -1) {
      repositories[file.slice(0, -3)] = require(directory + '/' + file)
    }
  })

  return repositories
}

/**
 * This plugin is a concrete implementation of the @arkecosystem/core-database interface.
 *
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  alias: 'database',
  register: async (hook, config, app) => {
    logger.info('Starting Database Interface...')

    let database = app.blockchainManager.getDb()

    await provider.init(config)
    database = await database.setDriver(provider, listRepositories())

    await app.blockchainManager.attachDatabaseInterface(database)

    return database
  }
}
