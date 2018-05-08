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
    recipient: Wallet
    sender: Wallet
  }

  type Round {
    id: Int!
    publicKey: String
    balance: String
    round: String
  }

  type Wallet {
    address: String
    publicKey: String
    secondPublicKey: String
    vote: String
    username: String
    balance: Arktoshi
    votebalance: Arktoshi
    producedBlocks: Int!
    missedBlocks: Int!
    transactions(limit: Limit, orderBy: OrderByInput, filter: TransactionFilter): [Transaction]
    blocks(limit: Limit, orderBy: OrderByInput): [Block]
  }
`
