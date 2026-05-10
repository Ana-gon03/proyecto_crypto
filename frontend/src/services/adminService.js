import api from './api';

// Arrendatarios

export const createArrendatario = async (data) => {
  const response = await api.post('/admin/arrendatarios', data);
  return response.data;
};

export const getArrendatarios = async (search = '') => {
  const response = await api.get(`/admin/arrendatarios${search ? `?search=${search}` : ''}`);
  return response.data;
};

export const getArrendatarioById = async (id) => {
  const response = await api.get(`/admin/arrendatarios/${id}`);
  return response.data;
};

// Actualizar arrendatario
export const updateArrendatario = async (id, usuarioData, arrendatarioData) => {
  const response = await api.put(`/admin/arrendatarios/${id}`, { usuarioData, arrendatarioData });
  return response.data;
};

export const deleteArrendatario = async (id) => {
  const response = await api.delete(`/admin/arrendatarios/${id}`);
  return response.data;
};

// Arrendadores
export const createArrendador = async (data) => {
  const response = await api.post('/admin/arrendadores', data);
  return response.data;
};

export const getArrendadores = async (search = '') => {
  const response = await api.get(`/admin/arrendadores${search ? `?search=${search}` : ''}`);
  return response.data;
};

export const getArrendadorById = async (id) => {
  const response = await api.get(`/admin/arrendadores/${id}`);
  return response.data;
};

// Actualizar arrendador
export const updateArrendador = async (id, usuarioData, arrendadorData, direccionData) => {
  const response = await api.put(`/admin/arrendadores/${id}`, { usuarioData, arrendadorData, direccionData });
  return response.data;
};

export const deleteArrendador = async (id) => {
  const response = await api.delete(`/admin/arrendadores/${id}`);
  return response.data;
};

// Propiedades
export const getPropiedades = async (search = '') => {
  const response = await api.get(`/admin/propiedades${search ? `?search=${search}` : ''}`);
  return response.data;
};

export const getPropiedadById = async (id) => {
  const response = await api.get(`/admin/propiedades/${id}`);
  return response.data;
};

export const updatePropiedad = async (id, propiedadData) => {
  const response = await api.put(`/admin/propiedades/${id}`, propiedadData);
  return response.data;
};

export const deletePropiedad = async (id) => {
  const response = await api.delete(`/admin/propiedades/${id}`);
  return response.data;
};


