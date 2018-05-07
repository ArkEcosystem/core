'use strict';

module.exports = `
  scalar JSON
  scalar Limit
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
    amount: Arktoshi
    fee: Arktoshi
    senderPublicKey: String
    recipientId: Address
    type: TransactionType
  }

  input OrderByInput {
    field: String
    direction: OrderDirection
  }
`
