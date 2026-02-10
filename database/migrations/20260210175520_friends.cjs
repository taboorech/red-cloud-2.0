const schema = process.env.DB_SCHEMA || 'public'

exports.up = async function(knex) {
  await knex.schema.createTable(`${schema}.friends`, (table) => {
    table.increments('id').primary();
    
    table.integer('user_id').unsigned().notNullable().references('id').inTable(`${schema}.users`).onDelete('CASCADE');
    table.integer('friend_id').unsigned().notNullable().references('id').inTable(`${schema}.users`).onDelete('CASCADE');
    table.string('status').notNullable();
    
    table.timestamps(true, true);
    
    table.unique(['user_id', 'friend_id']);
    table.index(['user_id', 'friend_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists(`${schema}.friends`);
};