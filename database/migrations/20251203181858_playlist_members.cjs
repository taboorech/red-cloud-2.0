const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.playlist_members`, (table) => {
    table.increments('id').primary();
    table.integer('playlist_id').unsigned().notNullable().references('id').inTable(`${schema}.playlists`).onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable(`${schema}.users`).onDelete('CASCADE');

    table.timestamps(true, true);

    table.unique(['playlist_id', 'user_id'], 'uq_playlist_member');
    table.index('user_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.playlist_members`)
};
