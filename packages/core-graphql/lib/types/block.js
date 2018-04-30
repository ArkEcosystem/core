'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database').connection
const blockModel = database.modelManager.getModel('block')

const { GraphQLObjectType, GraphQLList } = require('graphql')
const { attributeFields, resolver } = require('graphql-sequelize')

const { assign } = require('lodash')
const transactionType = require('./transaction')

module.exports = new GraphQLObjectType({
  name: 'block',
  fields: assign(attributeFields(blockModel), {
    transactions: {
      type: new GraphQLList(transactionType),
      resolve: resolver(database.models.block.associations.transactions)
    }
  })
})
