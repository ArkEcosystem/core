'use strict';

module.exports = `
  type Block {
    id: String
    version: Int!
    timestamp: Int!
    previousBlock: String
    height: Int!
    numberOfTransactions: Int!
    totalAmount: String
    totalFee: String
    reward: String
    payloadLength: Int!
    payloadHash: String
    generatorPublicKey: String
    blockSignature: String
    transactions(limit: Limit, offset: Offset, orderBy: OrderByInput, filter: TransactionFilter): [Transaction]
    generator: Wallet
  }

  type Transaction {
    id: String
    version: Int!
    timestamp: Int!
    senderPublicKey: String
    recipientId: String
    type: Int!
    vendorField: String
    amount: Int!
    fee: Int!
    signature: String
    block: Block
    recipient: Wallet
    sender: Wallet
  }

  type Wallet {
    address: String
    publicKey: String
    secondPublicKey: String
    vote: String
    username: String
    balance: Int!
    votebalance: Int!
    producedBlocks: Int!
    missedBlocks: Int!
    transactions(limit: Limit, orderBy: OrderByInput, filter: TransactionFilter): [Transaction]
    blocks(limit: Limit, orderBy: OrderByInput): [Block]
  }
`
