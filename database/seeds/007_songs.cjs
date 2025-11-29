const schema = process.env.DB_SCHEMA || 'public'

const songs = [{
  title: 'Song A',
  description: 'A popular song A',
  text: 'Lyrics of song A',
  language: 'English',
  duration_seconds: 210,
  url: 'http://example.com/song-a',
  is_active: true,
  metadata: { release_year: 2020 }
}, {
  title: 'Song B',
  description: 'A popular song B',
  text: 'Lyrics of song B',
  language: 'English',
  duration_seconds: 180,
  url: 'http://example.com/song-b',
  is_active: true,
  metadata: { release_year: 2019 }
}, {
  title: 'Song C',
  description: 'A popular song C',
  text: 'Lyrics of song C',
  language: null,
  duration_seconds: 240,
  url: 'http://example.com/song-c',
  is_active: false,
  metadata: { release_year: 2021 }
}]

exports.seed = async function(knex) {
  await knex(`${schema}.songs`).insert(songs);
};
