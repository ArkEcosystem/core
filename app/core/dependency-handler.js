const Promise = require('bluebird')

class DependencyHandler {
  checkDatabaseLibraries (config) {
    let dependencies = {
      'app/database/knex': {
        'mysql': ['knex', 'mysql2'],
        'sqlite': ['knex', 'sqlite3'],
        'postgres': ['knex', 'pg']
      }[config.server.db.dialect]
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
