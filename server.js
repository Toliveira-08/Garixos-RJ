const app = require('./app');
const { sequelize } = require('./models');

const PORTA = Number(process.env.PORT) || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao PostgreSQL');
  } catch (error) {
    console.error('❌ Não foi possível conectar ao banco. Confira as variáveis DB_* no .env.');
    console.error(error.message);
    process.exit(1);
  }

  app.listen(PORTA, () => {
    console.log(`🚀 Garixos rodando em http://localhost:${PORTA}`);
  });
})();
