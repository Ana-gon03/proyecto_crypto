const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LlavePublica = sequelize.define('LlavePublica', {
  idLlavePublica: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  llavePublicaPEM: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  llavePublicaHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  llavePublicaActiva: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  llavePublicaFechaReg: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  usuario_idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'llave_publica',
  timestamps: false,
});

module.exports = LlavePublica;