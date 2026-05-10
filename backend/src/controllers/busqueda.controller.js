const { Sequelize, Op } = require('sequelize');
const { 
  Propiedad, 
  Fotos, 
  Resena, 
  Servicio, 
  ServicioHasPropiedad, 
  Arrendador, 
  Usuario, 
  Direccion, 
  CP, 
  Arrendatario 
} = require('../models/associations');

// Buscar propiedades con filtros (VERSIÓN SIMPLIFICADA)
const buscarPropiedades = async (req, res) => {
  try {
    const {
      serviciosBasicos,
      serviciosEntretenimiento,
      serviciosAdicionales,
      precioMin,
      precioMax,
      ordenarPor = 'reciente',
      pagina = 1,
      limite = 12
    } = req.query;

    const offset = (pagina - 1) * limite;
    
    // Construir condiciones WHERE
    const whereConditions = {};
    
    // Filtro de rango de precios
    if (precioMin || precioMax) {
      whereConditions.propiedadPrecio = {};
      if (precioMin) whereConditions.propiedadPrecio[Op.gte] = parseFloat(precioMin);
      if (precioMax) whereConditions.propiedadPrecio[Op.lte] = parseFloat(precioMax);
    }

    // Construir orden
    let orderClause = [];
    
    // Orden por estatus
    orderClause.push([
      Sequelize.literal(`CASE 
        WHEN propiedadEstatus = 'Disponible' THEN 1
        WHEN propiedadEstatus = 'Sin Disponibilidad' THEN 2
        WHEN propiedadEstatus = 'Desactivada' THEN 3
        ELSE 4 END`), 
      'ASC'
    ]);

    switch (ordenarPor) {
      case 'antiguo':
        orderClause.push(['propiedadFechaRegis', 'ASC']);
        break;
      case 'calificacion':
        // Mejor calificación (DESC)
        orderClause.push([Sequelize.literal('(SELECT AVG(resenaCalGen) FROM resenas WHERE resenas.propiedad_idPropiedad = Propiedad.idPropiedad)'), 'DESC']);
        break;
      case 'calificacion_asc':
        // Menor calificación (ASC) - NUEVO
        orderClause.push([Sequelize.literal('(SELECT AVG(resenaCalGen) FROM resenas WHERE resenas.propiedad_idPropiedad = Propiedad.idPropiedad)'), 'ASC']);
        break;
      case 'precio_asc':
        orderClause.push(['propiedadPrecio', 'ASC']);
        break;
      case 'precio_desc':
        orderClause.push(['propiedadPrecio', 'DESC']);
        break;
      case 'reciente':
      default:
        orderClause.push(['propiedadFechaRegis', 'DESC']);
        break;
    }

    // Parsear servicios seleccionados
    const parseServicios = (param) => {
      if (!param) return [];
      if (Array.isArray(param)) return param.filter(Boolean).map(Number);
      return param.split(',').filter(Boolean).map(Number);
    };

    const servicioIds = [
      ...parseServicios(serviciosBasicos),
      ...parseServicios(serviciosEntretenimiento),
      ...parseServicios(serviciosAdicionales)
    ];

    // Si hay filtro de servicios, filtrar con subquery
    if (servicioIds.length > 0) {
      whereConditions.idPropiedad = {
        [Op.in]: Sequelize.literal(`(
          SELECT DISTINCT propiedad_idPropiedad 
          FROM servicio_has_propiedad 
          WHERE servicio_idServicio IN (${servicioIds.join(',')})
        )`)
      };
    }

    // Consulta principal SIN GROUP BY (más simple y rápido)
    const { count, rows } = await Propiedad.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Fotos,
          as: 'fotos',
          attributes: ['idFotos', 'fotosURL'],
          limit: 1,
          required: false
        },
        {
          model: Servicio,
          as: 'servicios',
          attributes: ['idServicio', 'servicioNombre', 'servicioCategoria'],
          through: { attributes: [] },
          required: false
        }
      ],
      order: orderClause,
      offset,
      limit: limite,
      distinct: true
    });

    // Para cada propiedad, obtener calificación y número de reseñas
    const propiedadesFormateadas = await Promise.all(rows.map(async (propiedad) => {
      // Obtener promedio de calificación general
      const resenasData = await Resena.findOne({
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('resenaCalGen')), 'promedio'],
          [Sequelize.fn('COUNT', Sequelize.col('idResena')), 'total']
        ],
        where: { propiedad_idPropiedad: propiedad.idPropiedad },
        raw: true
      });

      const calificacionGeneral = resenasData?.promedio 
        ? parseFloat(resenasData.promedio).toFixed(1) 
        : null;
      const totalResenas = parseInt(resenasData?.total) || 0;

      return {
        id: propiedad.idPropiedad,
        titulo: propiedad.propiedadTitulo,
        tipo: propiedad.propiedadTipo,
        lugares: propiedad.propiedadLugares,
        precio: propiedad.propiedadPrecio,
        precioPor: propiedad.propiedadPrecioPor,
        estatus: propiedad.propiedadEstatus,
        fechaRegistro: propiedad.propiedadFechaRegis,
        fotoPrincipal: propiedad.fotos && propiedad.fotos.length > 0 
          ? propiedad.fotos[0].fotosURL 
          : null,
        calificacionGeneral,
        totalResenas,
        servicios: propiedad.servicios || []
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        propiedades: propiedadesFormateadas,
        total: count,
        pagina: parseInt(pagina),
        totalPaginas: Math.ceil(count / limite),
        limite: parseInt(limite)
      }
    });

  } catch (error) {
    console.error('Error en buscarPropiedades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar propiedades',
      error: error.message
    });
  }
};

// Obtener detalle de una propiedad
const obtenerDetallePropiedad = async (req, res) => {
  try {
    const { id } = req.params;

    const propiedad = await Propiedad.findByPk(id, {
      include: [
        {
          model: Fotos,
          as: 'fotos',
          attributes: ['idFotos', 'fotosURL']
        },
        {
          model: Servicio,
          as: 'servicios',
          attributes: ['idServicio', 'servicioNombre', 'servicioCategoria'],
          through: { attributes: [] }
        },
        {
          model: Arrendador,
          as: 'arrendador',
          attributes: ['idArrendador', 'arrendadorRFC'],
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo', 'usuarioTel']
            }
          ]
        },
        {
          model: Direccion,
          as: 'direccion',
          include: [
            {
              model: CP,
              as: 'cp',
              attributes: ['d_codigo', 'd_asenta', 'D_mnpio', 'd_estado']
            }
          ]
        },
        {
          model: Resena,
          as: 'resenas',
          include: [
            {
              model: Arrendatario,
              as: 'arrendatario',
              attributes: ['idArrendatario'],
              include: [
                {
                  model: Usuario,
                  as: 'usuario',
                  attributes: ['usuarioNom', 'usuarioApePat']
                }
              ]
            }
          ],
          order: [['resenaFechaCreacion', 'DESC']],
          required: false
        }
      ]
    });

    if (!propiedad) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada'
      });
    }

    // Calcular promedios manualmente
    const resenas = propiedad.resenas || [];
    const totalResenas = resenas.length;
    const promedios = {
      calSerBasic: 0,
      calSerComEnt: 0,
      calSerAdicio: 0,
      calGen: 0
    };

    if (totalResenas > 0) {
      resenas.forEach(r => {
        promedios.calSerBasic += parseFloat(r.resenaCalSerBasic || 0);
        promedios.calSerComEnt += parseFloat(r.resenaCalSerComEnt || 0);
        promedios.calSerAdicio += parseFloat(r.resenaCalSerAdicio || 0);
        promedios.calGen += parseFloat(r.resenaCalGen || 0);
      });
      promedios.calSerBasic = (promedios.calSerBasic / totalResenas).toFixed(1);
      promedios.calSerComEnt = (promedios.calSerComEnt / totalResenas).toFixed(1);
      promedios.calSerAdicio = (promedios.calSerAdicio / totalResenas).toFixed(1);
      promedios.calGen = (promedios.calGen / totalResenas).toFixed(1);
    }

    const detalle = {
      id: propiedad.idPropiedad,
      titulo: propiedad.propiedadTitulo,
      descripcion: propiedad.propiedadDescripcion,
      tipo: propiedad.propiedadTipo,
      lugares: propiedad.propiedadLugares,
      precio: propiedad.propiedadPrecio,
      precioPor: propiedad.propiedadPrecioPor,
      estatus: propiedad.propiedadEstatus,
      fechaRegistro: propiedad.propiedadFechaRegis,
      direccion: {
        calle: propiedad.direccion?.direccionCalle || '',
        numExt: propiedad.direccion?.direccionNumExt || '',
        numInt: propiedad.direccion?.direccionNumInt || '',
        colonia: propiedad.direccion?.cp?.d_asenta || '',
        municipio: propiedad.direccion?.cp?.D_mnpio || '',
        estado: propiedad.direccion?.cp?.d_estado || '',
        cp: propiedad.direccion?.cp?.d_codigo || ''
      },
      fotos: propiedad.fotos || [],
      servicios: propiedad.servicios || [],
      arrendador: {
        id: propiedad.arrendador?.idArrendador,
        nombre: propiedad.arrendador?.usuario 
          ? `${propiedad.arrendador.usuario.usuarioNom} ${propiedad.arrendador.usuario.usuarioApePat} ${propiedad.arrendador.usuario.usuarioApeMat || ''}`.trim()
          : 'No disponible',
        correo: propiedad.arrendador?.usuario?.usuarioCorreo || 'No disponible',
        telefono: propiedad.arrendador?.usuario?.usuarioTel || 'No disponible'
      },
      calificaciones: {
        promedioCalSerBasic: totalResenas > 0 ? promedios.calSerBasic : null,
        promedioCalSerComEnt: totalResenas > 0 ? promedios.calSerComEnt : null,
        promedioCalSerAdicio: totalResenas > 0 ? promedios.calSerAdicio : null,
        promedioCalGen: totalResenas > 0 ? promedios.calGen : null,
        totalResenas
      },
      resenas: resenas.map(resena => ({
        id: resena.idResena,
        fecha: resena.resenaFechaCreacion,
        duracionRenta: resena.resenaDuracionRenta,
        descripcion: resena.resenaDescrip,
        calSerBasic: resena.resenaCalSerBasic,
        calSerComEnt: resena.resenaCalSerComEnt,
        calSerAdicio: resena.resenaCalSerAdicio,
        calGen: resena.resenaCalGen,
        sentimiento: resena.resenaSentimiento,
        autor: {
          nombre: resena.arrendatario?.usuario 
            ? `${resena.arrendatario.usuario.usuarioNom} ${resena.arrendatario.usuario.usuarioApePat}`.trim()
            : 'Anónimo'
        }
      })) || []
    };

    res.status(200).json({
      success: true,
      data: detalle
    });

  } catch (error) {
    console.error('Error en obtenerDetallePropiedad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle de la propiedad',
      error: error.message
    });
  }
};

// Obtener servicios
const obtenerServicios = async (req, res) => {
  try {
    const servicios = await Servicio.findAll({
      order: [
        ['servicioCategoria', 'ASC'],
        ['servicioNombre', 'ASC']
      ]
    });

    const serviciosAgrupados = {
      Basicos: [],
      Entretenimiento: [],
      Adicionales: []
    };

    servicios.forEach(servicio => {
      switch (servicio.servicioCategoria) {
        case 'Basico':
          serviciosAgrupados.Basicos.push(servicio);
          break;
        case 'Entretenimiento':
          serviciosAgrupados.Entretenimiento.push(servicio);
          break;
        case 'Adicional':
          serviciosAgrupados.Adicionales.push(servicio);
          break;
      }
    });

    res.status(200).json({
      success: true,
      data: serviciosAgrupados
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

module.exports = {
  buscarPropiedades,
  obtenerDetallePropiedad,
  obtenerServicios
};