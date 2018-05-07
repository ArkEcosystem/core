'use strict';

const { makeExecutableSchema } = require('graphql-tools')
const resolvers = require('./resolvers')
const typeDefs = require('./defs')

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers
})
