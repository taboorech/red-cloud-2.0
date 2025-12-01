const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.song_listenings`, (table) => {
    table.increments('id').primary();
    table.integer('song_id').unsigned().notNullable().references('id').inTable('songs').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('listened_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['user_id', 'listened_at']);
    table.index(['song_id', 'listened_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.song_listenings`)
};
