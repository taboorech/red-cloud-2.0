const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.users`, (table) => {
    table.increments('id').primary();
    table.string("username").notNullable();
    table.string("email").notNullable().unique();
    table.string("avatar").nullable();
    table.string("role").notNullable();

    table.timestamps(true, true)
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.users`)
};
