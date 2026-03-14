const schema = process.env.DB_SCHEMA || 'public'

exports.up = function (knex) {
  return knex.schema.createTable(`${schema}.user_activities`, function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable(`${schema}.users`).onDelete("CASCADE");
    table.string("content_type", 50).notNullable();
    table.text("result").nullable();
    table.jsonb("metadata").nullable();
    table.timestamps(true, true);

    table.index(["user_id"]);
    table.index(["content_type"]);
    table.index(["user_id", "content_type"]);
    table.index(["created_at"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists(`${schema}.user_activities`);
};