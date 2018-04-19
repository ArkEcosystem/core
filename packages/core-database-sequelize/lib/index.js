'use strict';

const SequelizeConnection = require('./connection')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (manager, options) => {
    manager.get('logger').info('Establishing Database Connection...')

    const sequelize = new SequelizeConnection(options)

    await manager.get('database').makeConnection(sequelize)
  }
}
