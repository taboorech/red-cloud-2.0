const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.playlists`, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.integer('owner_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_public').notNullable().defaultTo(false);

    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.playlists`)
};
