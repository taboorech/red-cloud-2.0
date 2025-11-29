exports.seed = async function(knex) {
  const songs = await knex('songs')
  const genres = await knex('genres')

  await Promise.all(songs.map(async (song) => {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    await knex('song_genres').insert({
      song_id: song.id,
      genre_id: genre.id
    });
  }))
};
