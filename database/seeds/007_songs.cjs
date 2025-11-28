const schema = process.env.DB_SCHEMA || 'public'

const songs = [{
  title: 'Song A',
  associated_country: 'USA',
  duration_seconds: 210,
  url: 'http://example.com/song-a',
  metadata: { release_year: 2020 }
}, {
  title: 'Song B',
  associated_country: 'UK',
  duration_seconds: 180,
  url: 'http://example.com/song-b',
  metadata: { release_year: 2019 }
}, {
  title: 'Song C',
  associated_country: null,
  duration_seconds: 240,
  url: 'http://example.com/song-c',
  metadata: { release_year: 2021 }
}]

exports.seed = async function(knex) {
  await knex(`${schema}.songs`).insert(songs);
};
