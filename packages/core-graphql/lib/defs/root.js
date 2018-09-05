'use strict';

/**
 * Necessary for the GraphQL engine to have a root schema and a base query.
 * Here we have definitions for root queries, which are like endpoints in a
 * REST API. Every root query has an associated return structure which is
 * based on types defined in types.js.
 */
module.exports = `
  type Query {
    block(id: String): Block
    blocks(limit: Limit, offset: Offset, orderBy: OrderByInput, filter: BlockFilter): [Block]
    transaction(id: String): Transaction
    transactions(limit: Limit, orderBy: OrderByInput, filter: TransactionFilter): [Transaction]
    wallet(address: String, publicKey: String, username: String): Wallet
    wallets(limit: Limit, orderBy: OrderByInput, filter: WalletFilter): [Wallet]
  }

  schema {
    query: Query
  }
`
