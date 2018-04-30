'use strict';

const { GraphQLObjectType, GraphQLString, GraphQLInt } = require('graphql')

module.exports = new GraphQLObjectType({
  name: 'transaction',
  fields: {
    id: {
      type: GraphQLString
    },
    version: {
      type: GraphQLInt
    },
    blockId: {
      type: GraphQLString
    },
    timestamp: {
      type: GraphQLInt
    },
    senderPublicKey: {
      type: GraphQLString
    }
  }
})
