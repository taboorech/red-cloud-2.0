const envName = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

require('dotenv').config({ path: envName });

const standardConfig = {
  client: 'pg',
  connection: process.env.PG_DB_CONNECTION_STRING,
  searchPath: process.env.DB_SCHEMA ? [process.env.DB_SCHEMA] : ['public'],
  migrations: {
    tableName: 'migrations',
    directory: './database/migrations',
    extension: 'cjs',
    schemaName: process.env.DB_SCHEMA || 'public'
  },
  seeds: {
    directory: './database/seeds',
    extension: 'js',
  },
  pool: {
    min: 2,
    max: 20
  }
};

module.exports = {
  test: {
    ...standardConfig,
  },
  development: {
    ...standardConfig
  },
  staging: {
    ...standardConfig
  },
  production: {
    ...standardConfig
  }
};
