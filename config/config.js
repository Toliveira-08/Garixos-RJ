// Configuração do banco lida de variáveis de ambiente (.env).
// Usada tanto pela aplicação (models/index.js) quanto pelo sequelize-cli (.sequelizerc).
require('dotenv').config({ quiet: true });

const base = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
  logging: false
};

// Em produção (Render, Railway, Neon...) normalmente há uma DATABASE_URL única.
const comUrl = process.env.DATABASE_URL
  ? {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      logging: false,
      dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {}
    }
  : null;

module.exports = {
  development: comUrl || { ...base, database: process.env.DB_NAME || 'garixos_dev' },
  test: { ...base, database: process.env.DB_NAME_TEST || 'garixos_test' },
  production: comUrl || { ...base, database: process.env.DB_NAME || 'garixos_prod' }
};
