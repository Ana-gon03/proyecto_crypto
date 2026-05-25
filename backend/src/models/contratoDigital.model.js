const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContratoDigital = sequelize.define('ContratoDigital', {
  idContratoDigital: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  arrendamiento_idArrendamiento: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  pdfBytes: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
  },
  pdfHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  firmaArrendador: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  firmaArrendatario: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  certSerialArrendador: {
    type: DataTypes.STRING(36),
    allowNull: true,
  },
  certSerialArrendatario: {
    type: DataTypes.STRING(36),
    allowNull: true,
  },
  estadoFirma: {
    type: DataTypes.ENUM('pendiente_arrendador', 'pendiente_arrendatario', 'completo'),
    defaultValue: 'pendiente_arrendador',
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fechaFirmaArrendador: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fechaFirmaArrendatario: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'contrato_digital',
  timestamps: false,
});

module.exports = ContratoDigital;
