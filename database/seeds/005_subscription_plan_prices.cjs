const schema = process.env.DB_SCHEMA || 'public'

const prices = [
  {
    subscription_plan_id: 2,
    stripe_price_id: 'price_1SThGIRoyp6vqiKZEhTAmhgW',
    currency: 'usd',
    amount: 5.00,
    billing_interval: 'month'
  }
]

exports.seed = async function(knex) {
  await knex(`${schema}.subscription_plan_prices`).insert(prices);
};
