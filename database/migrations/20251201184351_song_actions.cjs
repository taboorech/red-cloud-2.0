const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.song_actions`, (table) => {
    table.increments('id').primary();
    table.integer('song_id').unsigned().notNullable().references('id').inTable('songs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable()

    table.unique(['song_id', 'user_id'], 'uq_song_user');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.song_actions`)
};
