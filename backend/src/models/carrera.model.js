const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Carrera = sequelize.define('Carrera', {
  idCarrera: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  carreraNombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  carreraClave: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  idUnidadAcademica: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'carrera',
  timestamps: false,
});

module.exports = Carrera;