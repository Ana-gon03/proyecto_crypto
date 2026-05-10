const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  idUsuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuarioNom: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  usuarioApePat: {
    type: DataTypes.STRING(35),
    allowNull: false,
  },
  usuarioApeMat: {
    type: DataTypes.STRING(35),
    allowNull: true,
  },
  usuarioCorreo: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
  },
  usuarioTel: {
    type: DataTypes.STRING(13),
    allowNull: true,
  },
  usuarioCurp: {
    type: DataTypes.STRING(18),
    allowNull: true,
    unique: true,
  },
  usuarioContra: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  usuarioFechaNac: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  usuarioFechaRegis: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usuarioFechaUIS: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usuarioCodigo: {
    type: DataTypes.STRING(8),
    allowNull: true,
  },
  usuarioCorreoVerificado: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
  },
  usuarioCodigoFecha: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Criptografía E2E — claves públicas del usuario (P-256)
  ecdsaPublicKey: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  ecdhPublicKey: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  clavesGeneradas: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
  },
}, {
  tableName: 'usuario',
  timestamps: false,
});

module.exports = Usuario;