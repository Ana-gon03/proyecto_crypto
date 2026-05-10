const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fotos = sequelize.define('Fotos', {
  idFotos: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fotosURL: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  propiedad_idPropiedad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'fotos',
  timestamps: false,
});

module.exports = Fotos;