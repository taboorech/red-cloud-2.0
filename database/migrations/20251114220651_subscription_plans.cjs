const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.subscription_plans`, (table) => {
    table.increments('id').primary();
    table.string('title').notNullable().unique();
    table.string('description').notNullable();

    table.string('stripe_product_id').nullable().unique();

    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_public').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);

    table.timestamps(true, true);

    table.index('is_active');
    table.index('sort_order');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.subscription_plans`)
};
