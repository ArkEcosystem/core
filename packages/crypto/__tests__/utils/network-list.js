// TODO: replace fast-glob with tiny-glob
const fg = require('fast-glob')
const path = require('path')

const entries = fg.sync([path.resolve(__dirname, '../../lib/networks/**/*.json')])

let NETWORKS = {}
entries.forEach(file => (NETWORKS[path.parse(file).name] = require(file)))

let NETWORKS_LIST = []
entries.forEach(file => NETWORKS_LIST.push(require(file)))

module.exports = { NETWORKS, NETWORKS_LIST }
