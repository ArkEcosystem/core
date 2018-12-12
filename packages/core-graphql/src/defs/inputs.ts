export const inputs = `
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
`;
