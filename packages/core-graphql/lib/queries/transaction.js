'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database')
const repository = database.transactions

const type = require('../types/transaction')
const { GraphQLNonNull, GraphQLString, GraphQLList, GraphQLInt } = require('graphql')

module.exports = {
  transaction: {
    type,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: async (root, args) => repository.findById(args.id)
  },
  transactions: {
    type: new GraphQLList(type),
    args: {
      limit: {
        type: GraphQLInt
      },
      orderBy: {
        type: GraphQLString
      },
      offset: {
        type: GraphQLInt
      },
      senderPublicKey: {
        type: GraphQLString
      },
      recipientId: {
        type: GraphQLString
      }
    },
    async resolve (root, args) {
      const result = await repository.findAll({
        limit: args.limit,
        orderBy: args.orderBy,
        offset: args.offset,
        senderPublicKey: args.senderPublicKey,
        recipientId: args.recipientId
      }, false)
      return result
    }
  }
}
