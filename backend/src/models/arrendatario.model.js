const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Arrendatario = sequelize.define('Arrendatario', {
  idArrendatario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  arrendatarioBoleta: {
    type: DataTypes.STRING(12),
    allowNull: true,
  },
  arrendatarioVerificado: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
  },
  arrendatarioFechaVerificación: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  arrendatarioUser: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  usuario_idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  carrera_idCarrera: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'arrendatario',
  timestamps: false,
});

module.exports = Arrendatario;