'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Almacena claves ECDH efímeras del servidor para intercambios de sesión
const SesionECDH = sequelize.define('SesionECDH', {
  idSesionECDH: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Clave pública efímera del servidor (raw P-256, base64)
  publicKeyEfimera: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'sesion_ecdh',
  timestamps: false,
});

module.exports = SesionECDH;
