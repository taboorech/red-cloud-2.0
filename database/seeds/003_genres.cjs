const schema = process.env.DB_SCHEMA || 'public'

const genres = [
  { title: 'Rock' },
  { title: 'Pop' },
  { title: 'Jazz' },
  { title: 'Classical' },
  { title: 'Hip Hop' },
  { title: 'Electronic' },
  { title: 'Country' },
  { title: 'Reggae' },
  { title: 'Blues' },
  { title: 'Metal' }
]

exports.seed = async function(knex) {
  await knex(`${schema}.genres`).insert(genres);
};
