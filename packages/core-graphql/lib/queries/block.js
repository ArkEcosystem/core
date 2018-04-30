'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database')
const repository = database.blocks

const type = require('../types/block')
const { GraphQLNonNull, GraphQLString, GraphQLList, GraphQLInt } = require('graphql')

module.exports = {
  block: {
    type: type,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: async (root, args) => repository.findById(args.id)
  },
  blocks: {
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
      height: {
        type: GraphQLInt
      },
      generatorPublicKey: {
        type: GraphQLString
      }
    },
    async resolve (root, args) {
      const result = await repository.findAll({
        limit: args.limit,
        orderBy: args.orderBy,
        offset: args.offset,
        height: args.height,
        generatorPublicKey: args.generatorPublicKey
      }, false)
      return result
    }
  }
}
