const fs = require('fs')
const path = require('path')

module.exports = {
  provider: require('./provider'),
  repositories: () => {
    const repositories = {}

    let directory = path.resolve(__dirname, './repositories')

    fs.readdirSync(directory).forEach(file => {
      if (file.indexOf('.js') !== -1) {
        repositories[file.slice(0, -3)] = require(directory + '/' + file)
      }
    })

    return repositories
  }
}
