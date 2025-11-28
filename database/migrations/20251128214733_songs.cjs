const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.songs`, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('language').nullable();
    table.integer('duration_seconds').notNullable();
    table.string('url').notNullable();
    table.jsonb('metadata').nullable();

    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.songs`)
};
