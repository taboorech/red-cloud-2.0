const schema = process.env.DB_SCHEMA || 'public'

const plans = [{
  title: 'Free Plan',
  description: 'A basic plan with limited features',
  stripe_product_id: '',
  is_active: true,
  is_public: true,
  sort_order: 1
}, {
  title: 'Premium Plan',
  description: 'A professional plan with advanced features',
  stripe_product_id: 'prod_TQYMkqCjhcsb9G',
  is_active: true,
  is_public: true,
  sort_order: 2
}]
exports.seed = async function(knex) {
  await knex(`${schema}.subscription_plans`).insert(plans);
};
