// src/services/arrendamientoService.js
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

// Crear arrendamiento (sin contrato aún)
export const crearArrendamiento = async (datos) => {
  const response = await api.post('/arrendamientos', datos);
  return response.data;
};

// Actualizar arrendamiento
export const actualizarArrendamiento = async (id, datos) => {
  const response = await api.put(`/arrendamientos/${id}`, datos);
  return response.data;
};

// Finalizar arrendamiento (solicitud del arrendador)
export const finalizarArrendamiento = async (id) => {
  const response = await api.put(`/arrendamientos/${id}/finalizar`);
  return response.data;
};

// Buscar arrendatario por username o correo (para el modal de creación)
export const buscarArrendatario = async (termino) => {
  const response = await api.get(`/usuarios/buscar-arrendatario?q=${termino}`);
  return response.data;
};

// Obtener arrendatario por ID (incluye su clave pública)
export const buscarArrendatarioPorId = async (id) => {
  const response = await api.get(`/usuarios/arrendatario/${id}`);
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