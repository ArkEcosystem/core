const fs = require('fs')
const createServer = require('./create')

module.exports = async (options, callback, secure) => {
  options.host = secure.host
  options.port = secure.port
  options.tls = {
    key: fs.readFileSync(secure.key),
    cert: fs.readFileSync(secure.cert),
  }

  return createServer(options, callback, secure)
}
