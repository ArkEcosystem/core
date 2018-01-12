const Promise = require('bluebird')

class DependencyHandler {
  checkDatabaseLibraries(config) {
    let dependencies = {
      'database/sequelize': {
        'mysql': ['sequelize', 'mysql2'],
        'sqlite': ['sequelize', 'sqlite3'],
        'postgres': ['sequelize', 'pg', 'pg-hstore'],
        'mssql': ['sequelize', 'tedious'],
      }[config.server.db.dialect]
    }[config.server.db.driver]

    return this._install(dependencies)
  }

  _install(dependencies) {
    dependencies = dependencies.filter(value => !this._exists(value))

    if (!dependencies.length) {
      return Promise.resolve(true);
    }

    return Promise
      .promisifyAll(require('child_process'))
      .execAsync(`npm install ${dependencies.join(' ')} --save`)
  }

  _exists(dependency) {
    try {
      require.resolve(dependency)

      return true
    } catch (err) {
      return false
    }
  }
}

module.exports = new DependencyHandler()
