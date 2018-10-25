'use strict'

const Hapi = require('hapi')
const registerMonitor = require('./monitor')

module.exports = async options => {
  const server = new Hapi.Server(options)

  await server.register([require('vision'), require('inert'), require('lout')])

  if (process.env.NODE_ENV === 'test') {
    await registerMonitor(server)
  }

  return server
}
