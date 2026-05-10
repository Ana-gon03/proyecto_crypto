const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Servicio = sequelize.define('Servicio', {
  idServicio: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  servicioNombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  servicioCategoria: {
    type: DataTypes.ENUM('Basico', 'Entretenimiento', 'Adicional'),
    allowNull: false,
  },
}, {
  tableName: 'servicio',
  timestamps: false,
});

module.exports = Servicio;