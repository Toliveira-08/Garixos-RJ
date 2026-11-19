'use strict';
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');

/**
 * Cria o usuário administrador (perfil MASTER) a partir do .env:
 *   ADMIN_EMAIL e ADMIN_PASSWORD
 * Substitui o antigo login "master" que ficava fixo no código.
 */
module.exports = {
  async up(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const senha = process.env.ADMIN_PASSWORD;

    if (!email || !senha) {
      console.warn('ADMIN_EMAIL/ADMIN_PASSWORD não definidos no .env — admin não criado.');
      return;
    }

    const [existentes] = await queryInterface.sequelize.query(
      'SELECT id FROM "Usuarios" WHERE email = :email',
      { replacements: { email } }
    );
    if (existentes.length) return;

    await queryInterface.bulkInsert('Usuarios', [{
      nome: 'Administrador Garixos',
      email,
      senha: await bcrypt.hash(senha, 10),
      perfil: 'MASTER',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (email) await queryInterface.bulkDelete('Usuarios', { email });
  }
};
