'use strict';

module.exports = `
  scalar JSON
  scalar Limit
  scalar Offset
  scalar Arktoshi
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
    fee: Int!
    senderPublicKey: String
    recipientId: Address
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
