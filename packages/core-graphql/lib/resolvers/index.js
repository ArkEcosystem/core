'use strict';

const queries = require('./queries')
const Block = require('./relationship/block')
const Transaction = require('./relationship/transaction')
const Wallet = require('./relationship/wallet')
const GraphQLTypes = require('graphql-tools-types')

module.exports = {
  JSON: GraphQLTypes.JSON({ name: 'Json' }),
  Limit: GraphQLTypes.Int({ name: 'Limit', min: 1, max: 100 }),
  Offset: GraphQLTypes.Int({ name: 'Offset', min: 0 }),
  Arktoshi: GraphQLTypes.Float({ name: 'Arktoshi', min: 0.00000000, max: 999999999.99999999 }),
  Address: GraphQLTypes.String({ name: 'Address', regex: /^[AaDd]{1}[0-9a-zA-Z]{33}/g }),

  Query: queries,
  Block,
  Transaction,
  Wallet
}
