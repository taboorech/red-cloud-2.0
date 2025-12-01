const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.songs`, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.text('text').nullable();
    table.string('language').nullable();
    table.integer('duration_seconds').notNullable();
    table.string('url').notNullable();
    table.string('image_url').nullable();
    table.boolean('is_public').notNullable().defaultTo(true);
    table.jsonb('metadata').nullable();

    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.songs`)
};
