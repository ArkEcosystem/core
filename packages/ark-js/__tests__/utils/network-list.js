import fg from 'fast-glob'
import path from 'path'

const entries = fg.sync([path.resolve(__dirname, '../../src/networks/**/*.js')])

let NETWORKS = {}
entries.forEach(file => (NETWORKS[path.parse(file).name] = require(file)))

let NETWORKS_LIST = []
entries.forEach(file => NETWORKS_LIST.push(require(file)))

export { NETWORKS, NETWORKS_LIST }
