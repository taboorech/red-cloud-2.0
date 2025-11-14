const schema = process.env.DB_SCHEMA || 'public'

exports.seed = async function(knex) {
  const users = await knex(`${schema}.users`).select('*');
  const userPlans = []

  users.map((user) => {
    userPlans.push({
      user_id: user.id,
      subscription_plan_id: 1,
      started_at: new Date(),
      current_period_start: new Date(),
      current_period_end: null,
      trial_ends_at: null
    });
  })

  await knex(`${schema}.user_subscription_plans`).insert(userPlans);
};
