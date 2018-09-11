'use strict';

/**
 * Actual types which are relevant to queries issued to our GraphQL endpoint.
 * The basic ones are Block, Wallet and Transaction. They each have specific
 * properties and are representative of how they are stored in the Blockchain.
 * For example, a Block type has an array of transactions [Transaction], and
 * Transaction itself is a type which has sender and recipiet Wallet types.
 * Same principles apply to Wallet types, there is interoperability between
 * the defined types of this schema.
 */
module.exports = `
  type Block {
    id: String
    version: Int!
    timestamp: Int!
    previousBlock: String
    height: Int!
    numberOfTransactions: Int!
    totalAmount: Float
    totalFee: Float
    reward: Float
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
    amount: Float
    fee: Float
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
    balance: Float
    voteBalance: Float
    producedBlocks: Float
    missedBlocks: Float
    transactions(limit: Limit, offset: Offset, orderBy: OrderByInput): [Transaction]
    blocks(limit: Limit, offset: Offset, orderBy: OrderByInput): [Block]
  }
`
