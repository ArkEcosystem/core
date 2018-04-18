'use strict';

const fs = require('fs')
const path = require('path')
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
  register: async (manager, options) => {
    manager.get('logger').info('Starting Database Interface...')

    const blockchainManager = manager.get('blockchain')
    let database = blockchainManager.getDb()

    await provider.init(options)
    database = await database.setDriver(provider, listRepositories())

    await blockchainManager.attachDatabaseInterface(database)

    return database
  }
}
