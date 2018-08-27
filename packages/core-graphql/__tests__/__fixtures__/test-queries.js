/**
 * The queries sent as tests to the /graphql endpoint on localhost:4005
 * We use these to match against expected results to verify api behaviour
 * The procedure is to create GraphQL queries with this data and send
 * the query with graphql-tools to our running endpoint.
 */
module.exports = {
  block: [
    { id: 777 },
    { id: 123 },
    { id: 7 }
  ],
  blocks: [
    { limit: 2, offset: 1, orderBy: null, filter: null },
    { limit: 1, offset: 0, orderBy: null, filter: null }
  ],
  transaction: [
    { id: 'test tx 1' },
    { id: 'test tx 2' },
    { id: 'test tx 3' }
  ],
  transactions: [
    { limit: 3, orderBy: null, filter: null },
    { limit: 1, orderBy: null, filter: null }
  ],
  wallet: [
    { address: 'AdXpdaTXD9s2Nw23Sys7Crbinvsj6ohUA6' },
    { publicKey: 'arbitrary' },
    { username: 'cheesePuff' }
  ],
  wallets: [
    { limit: 3, orderBy: 'username', filter: null },
    { limit: 1, orderBy: 'address', filter: null },
    { limit: 2, orderBy: 'publicKey', filter: null }
  ]
}
