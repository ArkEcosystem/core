const tg = require('tiny-glob/sync')
const path = require('path')

const entries = tg('../../lib/networks/**/*.json', { cwd: __dirname })

const NETWORKS = {}
entries.forEach(file => {
  NETWORKS[path.parse(file).name] = require(file)
})

const NETWORKS_LIST = []
entries.forEach(file => NETWORKS_LIST.push(require(file)))

module.exports = { NETWORKS, NETWORKS_LIST }
