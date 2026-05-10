const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Propiedad = sequelize.define('Propiedad', {
  idPropiedad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  propiedadTitulo: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  propiedadDescripcion: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  propiedadTipo: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  propiedadLugares: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  propiedadPrecio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
  },
  propiedadPrecioPor: {  
    type: DataTypes.ENUM('Propiedad', 'Persona', 'Habitación'),
    allowNull: false,
    defaultValue: 'Persona',
  },
  propiedadEstatus: {
    type: DataTypes.ENUM('Disponible', 'Sin Disponibilidad', 'Desactivada'),
    allowNull: true,
    defaultValue: 'Disponible',
  },
  propiedadFechaRegis: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  direccion_idDireccion: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  arrendador_idArrendador: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'propiedad',
  timestamps: false,
});

module.exports = Propiedad;