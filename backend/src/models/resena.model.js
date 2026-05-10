const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resena = sequelize.define('Resena', {
  idResena: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  resenaFechaCreacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resenaDuracionRenta: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  resenaDescrip: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  resenaCalSerBasic: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
  },
  resenaCalSerComEnt: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
  },
  resenaCalSerAdicio: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
  },
  resenaCalGen: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
  },
  resenaSentimiento: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  propiedad_idPropiedad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  arrendatario_idArrendatario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'resena',
  timestamps: false,
});

module.exports = Resena;