const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServicioHasPropiedad = sequelize.define('ServicioHasPropiedad', {
  servicio_idServicio: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  propiedad_idPropiedad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
}, {
  tableName: 'servicio_has_propiedad',
  timestamps: false,
});

module.exports = ServicioHasPropiedad;