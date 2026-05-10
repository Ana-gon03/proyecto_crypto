const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Direccion = sequelize.define('Direccion', {
  idDireccion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  direccionCalle: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  direccionNumExt: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  direccionNumInt: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  CP_idCP: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'direccion',
  timestamps: false,
});

module.exports = Direccion;