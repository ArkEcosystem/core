const fs = require('fs')
const expandHomeDir = require('expand-home-dir')
const createServer = require('./create')

module.exports = async (options, callback, secure) => {
  options.host = secure.host
  options.port = secure.port
  options.tls = {
    key: fs.readFileSync(expandHomeDir(secure.key)),
    cert: fs.readFileSync(expandHomeDir(secure.cert)),
  }

  return createServer(options, callback, secure)
}
