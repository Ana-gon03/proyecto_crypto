const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CP = sequelize.define('CP', {
  idCP: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  d_codigo: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  d_asenta: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  d_tipo_asenta: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  D_mnpio: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  d_estado: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  d_ciudad: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  d_CP: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  c_estado: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  c_oficina: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  c_CP: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  c_tipo_asenta: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  c_mnpio: {
    type: DataTypes.STRING(3),
    allowNull: true,
  },
  id_asenta_cpcons: {
    type: DataTypes.STRING(4),
    allowNull: true,
  },
  d_zona: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  c_cve_ciudad: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  cpAceptadoSistema: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
}, {
  tableName: 'CP',
  timestamps: false,
});

module.exports = CP;