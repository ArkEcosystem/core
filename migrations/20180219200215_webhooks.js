exports.up = (knex, Promise) => {
  return knex.schema.createTable('webhooks', table => {
    table.string('event').index()
    table.string('target')
    table.json('conditions')
    table.string('secret')
    table.boolean('enabled')
    table.timestamps()
  })
}

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('webhooks')
