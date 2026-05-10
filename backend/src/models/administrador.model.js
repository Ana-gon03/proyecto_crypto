const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Administrador = sequelize.define('Administrador', {
  idAdmin: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminUser: {
    type: DataTypes.STRING(45),
    allowNull: false,
    unique: true,
  },
  adminContra: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  adminFechaInicioSesion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'administrador',
  timestamps: false,
});

module.exports = Administrador;