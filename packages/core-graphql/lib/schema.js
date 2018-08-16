'use strict';

const { makeExecutableSchema } = require('graphql-tools')
const resolvers = require('./resolvers')
const typeDefs = require('./defs')

/**
 * Schema used by the Apollo GraphQL plugin for the hapi.js server.
 * NOTE: Concatenated Template Literals following GraphQL syntax consist
 * the executable schema.
 * @param {String} defini  tions
 * @param {String} resolvers
 */
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers
})
