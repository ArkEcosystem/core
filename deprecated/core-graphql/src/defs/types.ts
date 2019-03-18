export const types = `
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
    recipientId: Address
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
    address: Address
    publicKey: String
    secondPublicKey: String
    vote: String
    username: String
    balance: Float
    voteBalance: Float
    producedBlocks: Float
    transactions(limit: Limit, offset: Offset, orderBy: OrderByInput): [Transaction]
    blocks(limit: Limit, offset: Offset, orderBy: OrderByInput): [Block]
  }
`;
