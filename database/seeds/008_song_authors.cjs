const songAuthors = [{
  song_id: 1,
  user_id: 1,
  role: 'singer'
}, {
  song_id: 1,
  user_id: 2,
  role: 'composer'
}, {
  song_id: 1,
  user_id: 3,
  role: 'singer'
}, {
  song_id: 1,
  user_id: 2,
  role: 'lyricist'
}, {
  song_id: 1,
  user_id: 1,
  role: 'producer'
}, {
  song_id: 2,
  user_id: 2,
  role: 'singer'
}, {
  song_id: 2,
  user_id: 3,
  role: 'composer'
}, {
  song_id: 2,
  user_id: 1,
  role: 'lyricist'
}, {
  song_id: 3,
  user_id: 3,
  role: 'singer'
}, {
  song_id: 3,
  user_id: 1,
  role: 'composer'
}]

exports.seed = async function(knex) {
  await knex('song_authors').insert(songAuthors);
};
