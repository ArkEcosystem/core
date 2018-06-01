'use strict'

module.exports = {
  enabled: false,
  port: process.env.ARK_JSONRPC_PORT || 8080,
  allowRemote: true,
  whitelist: ['127.0.0.1', '192.168.*']
}
