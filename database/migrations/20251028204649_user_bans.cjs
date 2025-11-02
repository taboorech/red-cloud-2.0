const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.user_bans`, (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('reason').nullable();
    table.boolean("is_banned").notNullable().defaultTo(false);
    table.timestamp("banned_at").nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.user_bans`)
};
