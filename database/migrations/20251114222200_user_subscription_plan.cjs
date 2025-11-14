const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.user_subscription_plan`, (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('subscription_plan_id').unsigned().notNullable().references('id').inTable('subscription_plans').onDelete('CASCADE');

    table.timestamp('started_at').notNullable();
    table.timestamp('current_period_start').nullable();
    table.timestamp('current_period_end').nullable();
    table.timestamp('trial_ends_at').nullable();

    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.user_subscription_plan`)
};
