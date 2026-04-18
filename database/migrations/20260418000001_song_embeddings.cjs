const schema = process.env.DB_SCHEMA || 'public'

exports.up = function (knex) {
  return knex.schema.createTable(`${schema}.song_embeddings`, function (table) {
    table.increments("id").primary();
    table.integer("song_id").unsigned().notNullable()
      .references("id").inTable(`${schema}.songs`).onDelete("CASCADE");
    table.jsonb("embedding").notNullable();
    table.string("model", 100).notNullable();
    table.timestamps(true, true);

    table.unique(["song_id"]);
    table.index(["song_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists(`${schema}.song_embeddings`);
};
