const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.user_privacy_settings`, (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable(`${schema}.users`).onDelete('CASCADE');
    table.string('listening_visibility').notNullable().defaultTo('friends');
    table.string('presence_visibility').notNullable().defaultTo('friends');

    table.timestamps(true, true);

    table.unique(['user_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.user_privacy_settings`);
};
