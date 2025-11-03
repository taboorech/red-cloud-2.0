const schema = process.env.DB_SCHEMA || 'public'

const genres = [
  { id: 1, title: 'Rock' },
  { id: 2, title: 'Pop' },
  { id: 3, title: 'Jazz' },
  { id: 4, title: 'Classical' },
  { id: 5, title: 'Hip Hop' },
  { id: 6, title: 'Electronic' },
  { id: 7, title: 'Country' },
  { id: 8, title: 'Reggae' },
  { id: 9, title: 'Blues' },
  { id: 10, title: 'Metal' }
]

exports.seed = async function(knex) {
  await knex(`${schema}.genres`).insert(genres);
};
