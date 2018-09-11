'use strict';

const { ApolloServer } = require('apollo-server-hapi')
const resolvers = require('./resolvers')
const typeDefs = require('./defs')

/**
 * Schema used by the Apollo GraphQL plugin for the hapi.js server.
 */
module.exports = new ApolloServer({
  typeDefs,
  resolvers
})
