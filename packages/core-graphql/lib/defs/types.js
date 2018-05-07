'use strict';

module.exports = `
  type Block {
    id: String
    version: Int!
    timestamp: Int!
    previousBlock: String
    height: Int!
    numberOfTransactions: Int!
    transactions(limit: Limit, orderBy: OrderByInput, filter: TransactionFilter): [Transaction]
  }

  type Transaction {
    id: String
    version: Int!
    blockId: String
    timestamp: Int!
    senderPublicKey: String
    recipientId: String
    type: Int!
    vendorFieldHex: String
    amount: Arktoshi
    fee: Arktoshi
    serialized: String
    block: Block
  }
`
