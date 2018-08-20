'use strict';

const { makeExecutableSchema } = require('graphql-tools')
const resolvers = require('./resolvers')
const typeDefs = require('./defs')

/**
 * Schema used by the Apollo GraphQL plugin for the hapi.js server.
 */
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers
})
