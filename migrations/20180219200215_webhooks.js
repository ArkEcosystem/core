exports.up = (knex, Promise) => {
  return knex.schema.createTable('webhooks', table => {
    table.increments()
    table.string('event').index()
    table.string('target')
    table.json('conditions')
    table.string('secret')
    table.boolean('enabled')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = (knex, Promise) => knex.schema.dropTableIfExists('webhooks')
