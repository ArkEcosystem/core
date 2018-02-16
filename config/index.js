const path = require('path')
const fs = require('fs')
const dirTree = require('directory-tree')

module.exports = (network) => {
  const basePath = path.resolve(network)

  if (!fs.existsSync(basePath)) {
    throw new Error('The directory does not exist or is not accessible because of security settings.')
  }

  const formatName = (file) => {
    return path.basename(file.name, path.extname(file.name))
  }

  let configTree = {}

  dirTree(basePath, { extensions: /\.js/ }).children.forEach(entry => {
    let name = formatName(entry)

    if (entry.type === 'directory') {
      configTree[name] = {}
      entry.children.forEach(e => (configTree[name][formatName(e)] = require(e.path)))
    } else {
      configTree[name] = require(entry.path)
    }
  })

  return configTree
}
