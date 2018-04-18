'use strict';

const fs = require('fs')
const path = require('path')
const database = require('@arkecosystem/core-pluggy').get('database')
const provider = require('./provider')

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

exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (hook, config, app) => {
    await provider.init(config)

    database.setDriver(provider, listRepositories())

    return provider
  }
}
