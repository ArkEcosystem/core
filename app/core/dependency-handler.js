const Promise = require('bluebird')

class DependencyHandler {
  checkDatabaseLibraries (config) {
    let dependencies = {
      // KnexJS
      'app/database/knex': {
        'mysql': ['knex', 'objection', 'mysql'],
        'sqlite3': ['knex', 'objection', 'sqlite3'],
        'postgres': ['knex', 'objection', 'pg']
      }[config.server.db.options.client],
      // SequelizeDB
      'app/database/sequelize': {
        'mysql': ['sequelize', 'mysql2'],
        'sqlite': ['sequelize', 'sqlite3'],
        'postgres': ['sequelize', 'pg', 'pg-hstore'],
        'mssql': ['sequelize', 'tedious']
      }[config.server.db.options.dialect]
    }[config.server.db.driver]

    return this._install(dependencies)
  }

  async _install (dependencies) {
    dependencies = dependencies.filter(value => !this._exists(value))

    if (!dependencies.length) {
      return true
    }

    return Promise
      .promisifyAll(require('child_process'))
      .execAsync(`npm install ${dependencies.join(' ')} --save`)
  }

  _exists (dependency) {
    try {
      require.resolve(dependency)

      return true
    } catch (err) {
      return false
    }
  }
}

module.exports = new DependencyHandler()
