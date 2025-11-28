const schema = process.env.DB_SCHEMA || 'public'

const users = [
  {
    username: "Yehor_Admin",
    email: "karuselpopka@gmail.com",
    avatar: null,
    role: "admin",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    username: "Operator",
    email: 'kiselovegor22@gmail.com',
    avatar: null,
    role: "operator",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    username: "User",
    email: 'example@gmail.com',
    avatar: null,
    role: "user",
    created_at: new Date(),
    updated_at: new Date(),
  }
]

exports.seed = async function(knex) {
  await knex(`${schema}.users`).insert(users);
};
