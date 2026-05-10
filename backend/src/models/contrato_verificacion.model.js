const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContratoVerificacion = sequelize.define('ContratoVerificacion', {
  idVerificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contrato_idContrato: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  verificacionActor: {
    type: DataTypes.ENUM('arrendador', 'arrendatario', 'admin'),
    allowNull: false,
  },
  verificacionFirmaArr: {
    type: DataTypes.TINYINT(1),
    allowNull: true,
  },
  verificacionFirmaArrTario: {
    type: DataTypes.TINYINT(1),
    allowNull: true,
  },
  verificacionHashOk: {
    type: DataTypes.TINYINT(1),
    allowNull: true,
  },
  verificacionFecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  verificacionIP: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'contrato_verificacion',
  timestamps: false,
});

module.exports = ContratoVerificacion;