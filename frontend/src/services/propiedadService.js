import api from './api';

// Obtener propiedades del arrendador
export const getPropiedadesArrendador = async (idArrendador) => {
  const response = await api.get(`/propiedades/arrendador/${idArrendador}`);
  return response.data;
};

// Obtener una propiedad
export const getPropiedad = async (id) => {
  const response = await api.get(`/propiedades/${id}`);
  return response.data;
};

// Obtener servicios del catálogo
export const getServiciosCatalogo = async () => {
  const response = await api.get('/propiedades/catalogo/servicios');
  return response.data;
};

// Buscar dirección por CP
export const buscarCP = async (cp) => {
  const response = await api.get(`/propiedades/buscar-cp/${cp}`);
  return response.data;
};

// Crear propiedad
export const crearPropiedad = async (formData) => {
  const response = await api.post('/propiedades', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Cambiar estado de propiedad
export const cambiarEstadoPropiedad = async (id, estado) => {
  const response = await api.patch(`/propiedades/${id}/estado`, { estado });
  return response.data;
};

// Eliminar propiedad
export const eliminarPropiedad = async (id) => {
  const response = await api.delete(`/propiedades/${id}`);
  return response.data;
};

// Obtener propiedades disponibles para arrendamiento
export const getPropiedadesDisponibles = async (idArrendador) => {
  const response = await api.get(`/propiedades/disponibles/arrendador/${idArrendador}`);
  return response.data;
};

// Obtener propiedad completa (para editar)
export const getPropiedadCompleta = async (id) => {
  const response = await api.get(`/propiedades/${id}/completo`);
  return response.data;
};

// Actualizar propiedad
export const actualizarPropiedad = async (id, formData) => {
  const response = await api.put(`/propiedades/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const buscarPropiedades = async (filtros = {}) => {
  try {
    const response = await api.get('/propiedades/buscar', { params: filtros })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const obtenerServicios = async () => {
  try {
    const response = await api.get('/propiedades/servicios')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const obtenerDetallePropiedad = async (id) => {
  try {
    const response = await api.get(`/propiedades/detalle/${id}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}