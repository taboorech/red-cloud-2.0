const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.subscription_plan_prices`, (table) => {
    table.increments('id').primary();
    table.integer('subscription_plan_id').unsigned().notNullable().references('id').inTable('subscription_plans').onDelete('CASCADE');
    table.string('stripe_price_id').notNullable().unique();
    table.string('currency').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('billing_interval').notNullable();

    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.subscription_plan_prices`)
};
