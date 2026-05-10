const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Arrendamiento = sequelize.define('Arrendamiento', {
  idArrendamiento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  arrendamientoFechaInicio: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  arrendamientoRenta: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  arrendamientoDescrip: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  arrendamientoValEstudiante: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
  },
  arrendamientoValArrendador: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
  },
  arrendatario_idArrendatario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  propiedad_idPropiedad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'arrendamiento',
  timestamps: false,
});

module.exports = Arrendamiento;