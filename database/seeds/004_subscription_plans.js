const schema = process.env.DB_SCHEMA || 'public'

const plans = [{
  title: 'Free Plan',
  description: 'A basic plan with limited features',
  stripe_price_id: '',
  is_active: true,
  is_public: true,
  sort_order: 1
}, {
  title: 'Pro Plan',
  description: 'A professional plan with advanced features',
  stripe_price_id: '',
  is_active: true,
  is_public: true,
  sort_order: 2
}]
exports.seed = async function(knex) {
  await knex(`${schema}.subscription_plans`).insert(plans);
};
