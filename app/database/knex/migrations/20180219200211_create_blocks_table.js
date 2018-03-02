exports.up = (knex, Promise) => {
  return knex.schema.createTable('blocks', table => {
    table.string('id', 64).primary().unique()
    table.specificType('version', 'smallint')
    table.integer('timestamp')
    table.string('previousBlock', 64)
    table.integer('height').unique().index()
    table.integer('numberOfTransactions')
    table.bigInteger('totalAmount')
    table.bigInteger('totalFee')
    table.bigInteger('reward')
    table.integer('payloadLength')
    table.string('payloadHash', 64)
    table.string('generatorPublicKey', 66).references('publicKey').inTable('wallets').index()
    table.string('blockSignature', 256)
  })
}

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('blocks')
