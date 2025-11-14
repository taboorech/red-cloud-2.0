const schema = process.env.DB_SCHEMA || 'public'

const prices = [
  {
    subscription_plan_id: 1,
    stripe_price_id: 'price_1',
    currency: 'usd',
    amount: 0,
    billing_interval: 'monthly'
  },
  {
    subscription_plan_id: 2,
    stripe_price_id: 'price_2',
    currency: 'usd',
    amount: 19.99,
    billing_interval: 'monthly'
  },
  {
    subscription_plan_id: 2,
    stripe_price_id: 'price_3',
    currency: 'usd',
    amount: 199.99,
    billing_interval: 'yearly'
  }
]

exports.seed = async function(knex) {
  await knex(`${schema}.subscription_plan_prices`).insert(prices);
};
