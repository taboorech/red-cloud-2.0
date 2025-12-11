const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.notification_types`, (table) => {
    table.increments('id').primary();
    table.string('code', 50).notNullable().unique();
    table.string('title', 100).notNullable();
    table.text('description');
    table.boolean('requires_action').defaultTo(false);
    
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.notification_types`);
};