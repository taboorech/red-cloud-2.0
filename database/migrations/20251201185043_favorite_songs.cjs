const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.favorite_songs`, (table) => {
    table.increments('id').primary();
    table.integer('song_id').unsigned().notNullable().references('id').inTable('songs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    table.unique(['song_id', 'user_id'], 'uq_favorite_song_user');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.favorite_songs`)
};
