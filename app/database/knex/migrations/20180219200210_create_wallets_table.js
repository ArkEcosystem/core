exports.up = (knex, Promise) => {
  return knex.schema.createTable('wallets', table => {
    table.increments()
    table.string('address', 36).unique().index()
    table.string('publicKey', 66).unique().index()
    table.string('secondPublicKey', 66)
    table.string('vote', 66).index()
    table.string('username', 64).index()
    table.bigInteger('balance')
    table.bigInteger('votebalance')
    table.bigInteger('producedBlocks')
    table.bigInteger('missedBlocks')
  })
}

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('wallets')
