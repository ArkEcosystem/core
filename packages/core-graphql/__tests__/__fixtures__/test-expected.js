/**
 * Exected results from performing calls to the graphql api endpoints.
 * Considering the GraphQL endpoint doesn't return raw data, we are
 * checking if the result from the query matches few properties than
 * the test data we put into the database before the test query.
 *
 * TODO: Will convert to stripped down version of test-data.
 */
module.exports = {
  block: `
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
    transactions(limit: Limit, offset: Offset, orderBy: OrderByInput, filter: T$
    generator: Wallet
  }`,
  transaction: `
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
  }`,
  wallet: `
  type Wallet {
    address: String
    publicKey: String
    secondPublicKey: String
    vote: String
    username: String
    balance: Float
    votebalance: Float
    producedBlocks: Float
    missedBlocks: Float
    transactions(limit: Limit, offset: Offset, orderBy: OrderByInput): [Transac$
    blocks(limit: Limit, offset: Offset, orderBy: OrderByInput): [Block]
  }`
}
