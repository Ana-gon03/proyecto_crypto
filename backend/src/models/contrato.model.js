const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  idContrato: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  arrendamiento_idArrendamiento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contratoIV: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  contratoAuthTag: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  contratoCifrado: {
    type: DataTypes.TEXT('medium'),
    allowNull: false,
  },
  contratoFirmaArrendador: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contratoFechaFirmaArr: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  llavePub_idArrendador: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  contratoFirmaArrendatario: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contratoFechaFirmaArrTario: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  llavePub_idArrendatario: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  contratoEstado: {
    type: DataTypes.ENUM('pendiente_arrendador', 'pendiente_arrendatario', 'firmado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente_arrendador',
  },
  contratoHashPlano: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  contratoFechaCreacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  contratoFechaActualiz: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'contrato',
  timestamps: false,
});

module.exports = Contrato;