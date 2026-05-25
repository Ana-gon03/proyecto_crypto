const CP = require('./cp.model');
const Direccion = require('./direccion.model');
const Usuario = require('./usuario.model');
const UnidadAcademica = require('./unidadAcademica.model');
const Carrera = require('./carrera.model');
const Arrendatario = require('./arrendatario.model');
const Arrendador = require('./arrendador.model');
const Propiedad = require('./propiedad.model');
const Fotos = require('./fotos.model');
const Arrendamiento = require('./arrendamiento.model');
const Resena = require('./resena.model');
const Servicio = require('./servicio.model');
const ServicioHasPropiedad = require('./servicioHasPropiedad.model');
const Administrador = require('./administrador.model');
const ContratoDigital = require('./contratoDigital.model');

// Relaciones de Direccion
Direccion.belongsTo(CP, { foreignKey: 'CP_idCP', as: 'cp' });
CP.hasMany(Direccion, { foreignKey: 'CP_idCP', as: 'direcciones' });

// Relaciones de Carrera
Carrera.belongsTo(UnidadAcademica, { foreignKey: 'idUnidadAcademica', as: 'unidadAcademica' });
UnidadAcademica.hasMany(Carrera, { foreignKey: 'idUnidadAcademica', as: 'carreras' });

// Relaciones de Arrendatario
Arrendatario.belongsTo(Usuario, { foreignKey: 'usuario_idUsuario', as: 'usuario' });
Usuario.hasOne(Arrendatario, { foreignKey: 'usuario_idUsuario', as: 'arrendatario' });
Arrendatario.belongsTo(Carrera, { foreignKey: 'carrera_idCarrera', as: 'carrera' });
Carrera.hasMany(Arrendatario, { foreignKey: 'carrera_idCarrera', as: 'arrendatarios' });

// Relaciones de Arrendador
Arrendador.belongsTo(Usuario, { foreignKey: 'usuario_idUsuario', as: 'usuario' });
Usuario.hasOne(Arrendador, { foreignKey: 'usuario_idUsuario', as: 'arrendador' });
Arrendador.belongsTo(Direccion, { foreignKey: 'direccion_idDireccion', as: 'direccion' });
Direccion.hasMany(Arrendador, { foreignKey: 'direccion_idDireccion', as: 'arrendadores' });

// Relaciones de Propiedad
Propiedad.belongsTo(Direccion, { foreignKey: 'direccion_idDireccion', as: 'direccion' });
Direccion.hasMany(Propiedad, { foreignKey: 'direccion_idDireccion', as: 'propiedades' });
Propiedad.belongsTo(Arrendador, { foreignKey: 'arrendador_idArrendador', as: 'arrendador' });
Arrendador.hasMany(Propiedad, { foreignKey: 'arrendador_idArrendador', as: 'propiedades' });

// Relaciones de Fotos
Fotos.belongsTo(Propiedad, { foreignKey: 'propiedad_idPropiedad', as: 'propiedad' });
Propiedad.hasMany(Fotos, { foreignKey: 'propiedad_idPropiedad', as: 'fotos' });

// Relaciones de Arrendamiento
Arrendamiento.belongsTo(Arrendatario, { foreignKey: 'arrendatario_idArrendatario', as: 'arrendatario' });
Arrendatario.hasMany(Arrendamiento, { foreignKey: 'arrendatario_idArrendatario', as: 'arrendamientos' });
Arrendamiento.belongsTo(Propiedad, { foreignKey: 'propiedad_idPropiedad', as: 'propiedad' });
Propiedad.hasMany(Arrendamiento, { foreignKey: 'propiedad_idPropiedad', as: 'arrendamientos' });

// Relaciones de Resena
Resena.belongsTo(Propiedad, { foreignKey: 'propiedad_idPropiedad', as: 'propiedad' });
Propiedad.hasMany(Resena, { foreignKey: 'propiedad_idPropiedad', as: 'resenas' });
Resena.belongsTo(Arrendatario, { foreignKey: 'arrendatario_idArrendatario', as: 'arrendatario' });
Arrendatario.hasMany(Resena, { foreignKey: 'arrendatario_idArrendatario', as: 'resenas' });

// Relaciones de ServicioHasPropiedad (muchos a muchos)
Servicio.belongsToMany(Propiedad, { through: ServicioHasPropiedad, foreignKey: 'servicio_idServicio', otherKey: 'propiedad_idPropiedad', as: 'propiedades' });
Propiedad.belongsToMany(Servicio, { through: ServicioHasPropiedad, foreignKey: 'propiedad_idPropiedad', otherKey: 'servicio_idServicio', as: 'servicios' });

// Relaciones de ContratoDigital
ContratoDigital.belongsTo(Arrendamiento, { foreignKey: 'arrendamiento_idArrendamiento', as: 'arrendamiento' });
Arrendamiento.hasOne(ContratoDigital, { foreignKey: 'arrendamiento_idArrendamiento', as: 'contratoDigital' });

module.exports = {
  CP,
  Direccion,
  Usuario,
  UnidadAcademica,
  Carrera,
  Arrendatario,
  Arrendador,
  Propiedad,
  Fotos,
  Arrendamiento,
  Resena,
  Servicio,
  ServicioHasPropiedad,
  Administrador,
  ContratoDigital,
};