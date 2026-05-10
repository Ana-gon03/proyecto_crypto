const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Arrendador = sequelize.define('Arrendador', {
  idArrendador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  arrendadorRFC: {
    type: DataTypes.STRING(14),
    allowNull: true,
  },
  usuario_idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  direccion_idDireccion: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'arrendador',
  timestamps: false,
});

module.exports = Arrendador;