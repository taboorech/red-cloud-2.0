const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.playlists`, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('image_url').nullable();
    table.integer('owner_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_public').notNullable().defaultTo(false);

    table.timestamps(true, true);

    table.index('owner_id');
    table.index('is_public');
    table.index(['owner_id', 'is_public']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.playlists`)
};
