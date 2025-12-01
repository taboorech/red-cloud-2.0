const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.song_genres`, (table) => {
    table.increments('id').primary();
    table.integer('song_id').unsigned().notNullable().references('id').inTable('songs').onDelete('CASCADE');
    table.integer('genre_id').unsigned().notNullable().references('id').inTable('genres').onDelete('CASCADE');

    table.unique(['song_id', 'genre_id'], 'uq_song_genre');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.song_genres`)
};
