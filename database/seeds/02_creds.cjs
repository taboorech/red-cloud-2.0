const schema = process.env.DB_SCHEMA || 'public'

const userCredentials = [
  {
    id: 1,
    user_id: 1,
    provider: "local",
    credentials: JSON.stringify({ 
      password: '$2b$10$suXDTD5.zUULlITezcRSLO0Dgbzg/gdM8BglSYG5QM.Nt.qOJKZuK'
    }),
    created_at: new Date(),
  },
  {
    id: 2,
    user_id: 3,
    provider: "local",
    credentials: JSON.stringify({ 
      password: '$2b$10$suXDTD5.zUULlITezcRSLO0Dgbzg/gdM8BglSYG5QM.Nt.qOJKZuK'
    }),
    created_at: new Date(),
  },
];

exports.seed = async function(knex) {
  await knex(`${schema}.user_provider_credentials`).insert(userCredentials);
};
