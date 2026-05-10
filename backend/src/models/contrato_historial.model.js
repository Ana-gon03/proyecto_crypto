const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContratoHistorial = sequelize.define('ContratoHistorial', {
  idHistorial: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contrato_idContrato: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  historialEstadoAnterior: {
    type: DataTypes.ENUM('pendiente_arrendador', 'pendiente_arrendatario', 'firmado', 'rechazado'),
    allowNull: true,
  },
  historialEstadoNuevo: {
    type: DataTypes.ENUM('pendiente_arrendador', 'pendiente_arrendatario', 'firmado', 'rechazado'),
    allowNull: false,
  },
  historialActor: {
    type: DataTypes.ENUM('arrendador', 'arrendatario', 'sistema'),
    allowNull: false,
  },
  historialNota: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  historialFecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'contrato_historial',
  timestamps: false,
});

module.exports = ContratoHistorial;