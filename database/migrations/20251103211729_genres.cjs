const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.genres`, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable().unique();

    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.genres`)
};
