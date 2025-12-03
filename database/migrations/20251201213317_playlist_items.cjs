const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.playlist_items`, (table) => {
    table.increments('id').primary();
    table.integer('playlist_id').unsigned().notNullable().references('id').inTable(`${schema}.playlists`).onDelete('CASCADE');
    table.integer('song_id').unsigned().notNullable().references('id').inTable(`${schema}.songs`).onDelete('CASCADE');
    table.integer('position').unsigned().notNullable();

    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.playlist_items`)
};
