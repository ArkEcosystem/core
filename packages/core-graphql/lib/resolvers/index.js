'use strict';

const queries = require('./queries')
const Block = require('./relationship/block')
const Transaction = require('./relationship/transaction')
const Wallet = require('./relationship/wallet')
const GraphQLTypes = require('graphql-tools-types')

/**
 * Resolvers used by the executed schema when encountering a
 * scalar or type.
 *
 * All of our scalars are based on graphql-tools-types which helps us with
 * query standardization.
 *
 * We introduce relationships and queries for our own types,
 * these hold the data processing responsibilities of the complete
 * GraphQL query flow.
 */

module.exports = {
  JSON: GraphQLTypes.JSON({ name: 'Json' }),
  Limit: GraphQLTypes.Int({ name: 'Limit', min: 1, max: 100 }),
  Offset: GraphQLTypes.Int({ name: 'Offset', min: 0 }),
  Address: GraphQLTypes.String({ name: 'Address', regex: /^[AaDd]{1}[0-9a-zA-Z]{33}/ }),
  Query: queries,
  Block,
  Transaction,
  Wallet
}
