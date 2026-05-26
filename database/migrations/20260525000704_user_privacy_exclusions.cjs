const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.user_privacy_exclusions`, (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable(`${schema}.users`).onDelete('CASCADE');
    table.integer('excluded_user_id').unsigned().notNullable().references('id').inTable(`${schema}.users`).onDelete('CASCADE');
    table.string('scope').notNullable();

    table.timestamps(true, true);

    table.unique(['user_id', 'excluded_user_id', 'scope']);
    table.index('excluded_user_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.user_privacy_exclusions`);
};
