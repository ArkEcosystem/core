'use strict';

module.exports = `
  type Query {
    block(id: String): Block
    blocks(limit: Limit, orderBy: OrderByInput): [Block]
    transaction(id: String): Transaction
    transactions(limit: Limit, orderBy: OrderByInput, filter: TransactionFilter): [Transaction]
    round(id: Int!): Round
    rounds(limit: Limit, orderBy: OrderByInput): [Round]
    wallet(address: Address, publicKey: string, username: String): Wallet
    wallets(limit: Limit, orderBy: OrderByInput, vote: String): [Wallet]
  }
`
