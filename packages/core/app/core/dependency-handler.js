const Promise = require('bluebird')

class DependencyHandler {
  checkDatabaseLibraries (config) {
    let dependencies = {
      'app/database/sequelize': {
        'mysql': ['sequelize', 'umzug', 'mysql2'],
        'sqlite': ['sequelize', 'umzug', 'sqlite3'],
        'postgres': ['sequelize', 'umzug', 'pg', 'pg-hstore'],
        'mssql': ['sequelize', 'umzug', 'tedious']
      }[config.server.database.options.dialect]
    }[config.server.database.driver]

    if (!dependencies) {
      throw new Error('Invalid database driver specified.')
    }

    return this._install(dependencies)
  }

  async _install (dependencies) {
    dependencies = dependencies.filter(value => !this._exists(value))

    if (!dependencies.length) {
      return true
    }

    const promise = Promise.promisifyAll(require('child_process'))

    return process.env.NODE_ENV === 'development'
      ? promise.execAsync(`lerna add ${dependencies.join(' ')} --scope=@arkecosystem/core`)
      : promise.execAsync(`npm install ${dependencies.join(' ')} --save`)
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
