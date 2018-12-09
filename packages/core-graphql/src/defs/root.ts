export const root = `
  type Query {
    block(id: String): Block
    blocks(limit: Limit, offset: Offset, orderBy: OrderByInput, filter: BlockFilter): [Block]
    transaction(id: String): Transaction
    transactions(limit: Limit, orderBy: OrderByInput, filter: TransactionFilter): [Transaction]
    wallet(address: Address, publicKey: String, username: String): Wallet
    wallets(limit: Limit, orderBy: OrderByInput, filter: WalletFilter): [Wallet]
  }

  schema {
    query: Query
  }
`;
