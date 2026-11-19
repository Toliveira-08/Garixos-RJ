'use strict';

/**
 * Ajustes de integridade:
 *  - adiciona o perfil MASTER ao ENUM de usuários (usado pelo painel administrativo);
 *  - torna o email de usuário obrigatório e único;
 *  - corrige HorarioColetas.dia_semana, que tinha sido criado com os valores de perfil
 *    ('CLIENTE', 'ADMIN_INTERNO') por engano, para os dias da semana.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Usuarios_perfil" ADD VALUE IF NOT EXISTS 'MASTER';`
    );

    await queryInterface.changeColumn('Usuarios', 'email', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.addIndex('Usuarios', ['email'], {
      unique: true,
      name: 'usuarios_email_unique'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "HorarioColetas" ALTER COLUMN dia_semana DROP DEFAULT;
      ALTER TABLE "HorarioColetas" ALTER COLUMN dia_semana TYPE VARCHAR(10) USING NULL;
      DROP TYPE IF EXISTS "enum_HorarioColetas_dia_semana";
      CREATE TYPE "enum_HorarioColetas_dia_semana" AS ENUM
        ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO');
      ALTER TABLE "HorarioColetas" ALTER COLUMN dia_semana
        TYPE "enum_HorarioColetas_dia_semana" USING dia_semana::"enum_HorarioColetas_dia_semana";
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Usuarios', 'usuarios_email_unique');
    await queryInterface.changeColumn('Usuarios', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });
    // Valores de ENUM não podem ser removidos facilmente no PostgreSQL; MASTER permanece.
  }
};
