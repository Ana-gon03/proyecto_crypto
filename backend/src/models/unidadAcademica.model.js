const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UnidadAcademica = sequelize.define('UnidadAcademica', {
  idUnidadAcademica: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  unidadAcademicaNombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  unidadAcademicaClave: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'unidad_academica',
  timestamps: false,
});

module.exports = UnidadAcademica;