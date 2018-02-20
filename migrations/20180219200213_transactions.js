exports.up = (knex, Promise) => {
  return knex.schema.createTable('transactions', table => {
    table.string('id', 64).primary().unique()
    table.specificType('version', 'smallint')
    table.string('blockId', 64).references('id').inTable('blocks')
    table.timestamp('timestamp').index()
    table.string('senderPublicKey', 66).index()
    table.string('recipientId', 36).index()
    table.specificType('type', 'smallint')
    table.specificType('vendorFieldHex', 'blob').index()
    table.bigInteger('amount')
    table.bigInteger('fee')
    table.specificType('serialized', 'blob')
    table.timestamps()
  })
}

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('transactions')
