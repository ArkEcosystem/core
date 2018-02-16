const path = require('path')
const camelCase = require('lodash/camelCase')
const dirTree = require('directory-tree')

module.exports = async (network) => {
  const basePath = path.resolve(network)

  const formatName = (file) => {
    return camelCase(path.basename(file.name, path.extname(file.name)))
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
