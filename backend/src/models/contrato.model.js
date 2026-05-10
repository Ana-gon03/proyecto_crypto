'use strict';
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
  // PDF cifrado con AES-GCM (IV 12 bytes + ciphertext)
  contratoCifrado: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
  },
  // SHA-256 del PDF original en hexadecimal (64 chars)
  contratoHashDocumento: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  // Firma ECDSA del arrendador en base64
  contratoFirmaArrendador: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Firma ECDSA del arrendatario en base64
  contratoFirmaArrendatario: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contratoEstado: {
    type: DataTypes.ENUM('pendiente', 'firmado', 'aceptado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
  contratoFechaCreacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'contrato',
  timestamps: false,
});

module.exports = Contrato;
