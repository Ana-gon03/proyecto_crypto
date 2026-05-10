import api from './api';

// Obtener arrendamientos del arrendador
export const getArrendamientosArrendador = async (idArrendador) => {
  const response = await api.get(`/arrendamientos/arrendador/${idArrendador}`);
  return response.data;
};

// Obtener un arrendamiento por ID
export const getArrendamiento = async (id) => {
  const response = await api.get(`/arrendamientos/${id}`);
  return response.data;
};

// Crear arrendamiento
export const crearArrendamiento = async (datos) => {
  const response = await api.post('/arrendamientos', datos);
  return response.data;
};

// Actualizar arrendamiento
export const actualizarArrendamiento = async (id, datos) => {
  const response = await api.put(`/arrendamientos/${id}`, datos);
  return response.data;
};

// Finalizar arrendamiento
export const finalizarArrendamiento = async (id) => {
  const response = await api.put(`/arrendamientos/${id}/finalizar`);
  return response.data;
};

// Buscar arrendatario
export const buscarArrendatario = async (termino) => {
  const response = await api.get(`/usuarios/buscar-arrendatario?q=${termino}`);
  return response.data;
};

// Descargar PDF del contrato (ABRE EN NUEVA PESTAÑA)
export const descargarContratoPDF = async (id) => {
  const response = await api.get(`/arrendamientos/${id}/pdf`, {
    responseType: 'blob'
  });
  
  // Crear URL del blob y abrir en nueva pestaña
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  window.open(url, '_blank');
};