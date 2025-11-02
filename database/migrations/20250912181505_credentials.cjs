const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.user_provider_credentials`, (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string("provider").notNullable();
    table.jsonb("credentials").notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(["user_id", "provider"], 'public_user_id_provider_unique');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.user_provider_credentials`)
};
