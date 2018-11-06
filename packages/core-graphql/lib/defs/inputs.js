'use strict';

/**
 * Template for the inputs of our schema's types.
 * Scalars are the possible base values for query parameters.
 * OrderDirection defaults to DESC in the resolvers.
 * Includes an enum to check TransactionTypes with supplied query parameter.
 * Has filters to be used against the main types of queriable objects.
 * Order query by specified field, with respect to OrderDirection.
 */
module.exports = `
  scalar JSON
  scalar Limit
  scalar Offset
  scalar Address

  enum OrderDirection {
    ASC
    DESC
  }

  enum TransactionType {
    TRANSFER,
    SECOND_SIGNATURE,
    DELEGATE,
    VOTE,
    MULTI_SIGNATURE,
    IPFS,
    TIMELOCK_TRANSFER,
    MULTI_PAYMENT,
    DELEGATE_RESIGNATION
  }

  input TransactionFilter {
    fee: Float
    blockId: String
    senderPublicKey: String
    recipientId: String
    type: TransactionType
  }

  input BlockFilter {
    generatorPublicKey: String
  }

  input WalletFilter {
    vote: String
  }

  input OrderByInput {
    field: String
    direction: OrderDirection
  }
`
