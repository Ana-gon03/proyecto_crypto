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

// Función interna para intentar búsqueda con diferentes niveles de degradación
const intentarBusqueda = async (queryParams, nivel) => {
  const {
    busqueda,
    serviciosBasicos,
    serviciosEntretenimiento,
    serviciosAdicionales,
    precioMin,
    precioMax,
    ordenarPor = 'reciente',
    tipo,
    precioPor,
    lugaresMin,
    pagina = 1,
    limite = 12
  } = queryParams;

  const offset = (pagina - 1) * limite;
  const whereConditions = {
    propiedadEstatus: { [Op.ne]: 'Desactivada' }
  };

  // Aplicar filtros según nivel de degradación
  const aplicarBusquedaTexto = !['sin_texto', 'sin_tipo', 'sin_precioPor', 'minimo'].includes(nivel);
  const aplicarTipo = !['sin_tipo', 'sin_precioPor', 'minimo'].includes(nivel);
  const aplicarPrecioPor = !['sin_precioPor', 'minimo'].includes(nivel);
  const aplicarServicios = !['sin_servicios', 'sin_texto', 'sin_tipo', 'sin_precioPor', 'minimo'].includes(nivel);
  const expandirPrecio = nivel === 'precio_expandido';

  // Búsqueda por texto
  if (aplicarBusquedaTexto && busqueda && busqueda.trim()) {
    whereConditions[Op.or] = [
      { propiedadTitulo: { [Op.like]: `%${busqueda}%` } },
      { propiedadDescripcion: { [Op.like]: `%${busqueda}%` } }
    ];
  }

  // Filtro de precio
  if (precioMin || precioMax) {
    whereConditions.propiedadPrecio = {};
    if (precioMin) {
      const min = parseFloat(precioMin);
      whereConditions.propiedadPrecio[Op.gte] = expandirPrecio ? min * 0.7 : min;
    }
    if (precioMax) {
      const max = parseFloat(precioMax);
      whereConditions.propiedadPrecio[Op.lte] = expandirPrecio ? max * 1.3 : max;
    }
  }

  // Filtro de tipo de vivienda
  if (aplicarTipo && tipo) {
    whereConditions.propiedadTipo = tipo;
  }

  // Filtro de precio por
  if (aplicarPrecioPor && precioPor) {
    whereConditions.propiedadPrecioPor = precioPor;
  }

  // Filtro de lugares mínimos (SIEMPRE se aplica)
  if (lugaresMin) {
    whereConditions.propiedadLugares = { [Op.gte]: parseInt(lugaresMin) };
  }

  // Orden
  let orderClause = [];
  switch (ordenarPor) {
    case 'antiguo':
      orderClause.push(['propiedadFechaRegis', 'ASC']);
      break;
    case 'calificacion':
      orderClause.push([Sequelize.literal('(SELECT AVG(resenaCalGen) FROM resena WHERE resena.propiedad_idPropiedad = Propiedad.idPropiedad)'), 'DESC']);
      break;
    case 'calificacion_asc':
      orderClause.push([Sequelize.literal('(SELECT AVG(resenaCalGen) FROM resena WHERE resena.propiedad_idPropiedad = Propiedad.idPropiedad)'), 'ASC']);
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

  // Filtro de servicios
  if (aplicarServicios) {
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

    if (servicioIds.length > 0) {
      whereConditions.idPropiedad = {
        [Op.in]: Sequelize.literal(`(
          SELECT DISTINCT propiedad_idPropiedad 
          FROM servicio_has_propiedad 
          WHERE servicio_idServicio IN (${servicioIds.join(',')})
        )`)
      };
    }
  }

  // Include base
  const includeBase = [
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
    },
  ];

  // Include CP si hay búsqueda por texto
  if (aplicarBusquedaTexto && busqueda && busqueda.trim()) {
    includeBase.push({
      model: Direccion,
      as: 'direccion',
      required: false,
      include: [{
        model: CP,
        as: 'cp',
        required: false,
        where: { d_codigo: { [Op.like]: `%${busqueda}%` } }
      }]
    });
  }

  const { count, rows } = await Propiedad.findAndCountAll({
    where: whereConditions,
    include: includeBase,
    order: orderClause,
    offset,
    limit: parseInt(limite),
    distinct: true
  });

  return { count, rows };
};

const buscarPropiedades = async (req, res) => {
  try {
    const {
      precioMin,
      precioMax,
      lugaresMin,
      pagina = 1,
      limite = 12
    } = req.query;

    // Niveles de degradación en orden
    const niveles = [
      { key: 'completa', mensaje: null },
      { key: 'sin_servicios', mensaje: 'No pudimos encontrar una vivienda con todos los filtros que señalaste, pero estas son las opciones más cercanas a tu búsqueda' },
      { key: 'sin_texto', mensaje: 'No pudimos encontrar una vivienda con todos los filtros que señalaste, pero estas son las opciones más cercanas a tu búsqueda' },
      { key: 'precio_expandido', mensaje: 'No pudimos encontrar una vivienda con todos los filtros que señalaste, pero estas son las opciones más cercanas a tu búsqueda' },
      { key: 'sin_tipo', mensaje: 'No pudimos encontrar una vivienda con todos los filtros que señalaste, pero estas son las opciones más cercanas a tu búsqueda' },
      { key: 'sin_precioPor', mensaje: 'No pudimos encontrar una vivienda con todos los filtros que señalaste, pero estas son las opciones más cercanas a tu búsqueda' },
      { key: 'minimo', mensaje: 'No pudimos encontrar una vivienda con todos los filtros que señalaste, pero estas son las opciones más cercanas a tu búsqueda' }
    ];

    let resultados = null;
    let nivelAplicado = null;
    let mensajeRelajado = null;

    // Intentar cada nivel hasta encontrar resultados
    for (const nivel of niveles) {
      const intento = await intentarBusqueda(req.query, nivel.key);
      
      if (intento.count > 0 || nivel.key === 'minimo') {
        resultados = intento;
        nivelAplicado = nivel.key;
        mensajeRelajado = nivel.mensaje;
        break;
      }
    }

    // Obtener rango de precios globales
    const preciosGlobales = await Propiedad.findAll({
      where: { propiedadEstatus: { [Op.ne]: 'Desactivada' } },
      attributes: [
        [Sequelize.fn('MIN', Sequelize.col('propiedadPrecio')), 'minPrecio'],
        [Sequelize.fn('MAX', Sequelize.col('propiedadPrecio')), 'maxPrecio']
      ],
      raw: true
    });

    // Formatear propiedades
    const propiedadesFormateadas = await Promise.all(resultados.rows.map(async (propiedad) => {
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
        fotoPrincipal: propiedad.fotos?.[0]?.fotosURL || null,
        calificacionGeneral,
        totalResenas,
        servicios: propiedad.servicios || []
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        propiedades: propiedadesFormateadas,
        total: resultados.count,
        pagina: parseInt(pagina),
        totalPaginas: Math.ceil(resultados.count / parseInt(limite)),
        limite: parseInt(limite),
        precioMinGlobal: preciosGlobales[0]?.minPrecio || 0,
        precioMaxGlobal: preciosGlobales[0]?.maxPrecio || 10000,
        filtrosRelajados: nivelAplicado !== 'completa',
        mensajeRelajado: mensajeRelajado,
        nivelDegradacion: nivelAplicado
      }
    });

  } catch (error) {
    console.error('Error en buscarPropiedades:', error);
    res.status(500).json({ success: false, message: 'Error al buscar propiedades', error: error.message });
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