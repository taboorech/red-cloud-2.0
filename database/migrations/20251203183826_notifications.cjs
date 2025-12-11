const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.notifications`, (table) => {
    table.increments('id').primary();
    
    table.integer('type_id').unsigned().notNullable().references('id').inTable(`${schema}.notification_types`).onDelete('CASCADE');
    table.integer('recipient_id').unsigned().notNullable().references('id').inTable(`${schema}.users`).onDelete('CASCADE');
    table.integer('sender_id').unsigned().nullable().references('id').inTable(`${schema}.users`).onDelete('SET NULL');
    table.string('related_entity_type').nullable();
    table.integer('related_entity_id').unsigned().nullable();
    table.string('title').notNullable();
    table.text('message').nullable();
    table.jsonb('metadata').nullable();
    table.string('status');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('responded_at').nullable();
    
    table.timestamps(true, true);
    
    table.index('recipient_id');
    table.index('sender_id');
    table.index(['recipient_id', 'is_read']);
    table.index(['recipient_id', 'status']);
    table.index(['related_entity_type', 'related_entity_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.notifications`);
};