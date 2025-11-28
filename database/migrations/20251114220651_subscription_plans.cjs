const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.subscription_plans`, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable().unique();
    table.string('description').notNullable();

    table.string('stripe_product_id').notNullable().unique();

    table.boolean('is_active').defaultTo(true)
    table.boolean('is_public').defaultTo(true)
    table.integer('sort_order').defaultTo(0)

    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.subscription_plans`)
};
