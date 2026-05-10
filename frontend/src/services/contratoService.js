// src/services/contratoService.js
import api from './api';

// Registrar clave pública del usuario actual
export async function registrarClavePublica(publicKeyPem) {
  const response = await api.post('/clave-publica', { publicKeyPem });
  return response.data;
}

// Obtener clave pública de un usuario por su ID
export async function obtenerClavePublicaUsuario(idUsuario) {
  const response = await api.get(`/usuarios/${idUsuario}/clave-publica`);
  return response.data.publicKeyPem;
}

// Crear contrato (después de crear arrendamiento)
export async function crearContrato(datos) {
  const response = await api.post('/contratos', datos);
  return response.data;
}

// Obtener contrato por ID de arrendamiento
export async function obtenerContratoPorArrendamiento(idArrendamiento) {
  const response = await api.get(`/contratos/arrendamiento/${idArrendamiento}`);
  return response.data;
}

// Firmar contrato (arrendatario)
export async function firmarContrato(idContrato, firmaArrendatario) {
  const response = await api.post(`/contratos/${idContrato}/firmar`, { firmaArrendatario });
  return response.data;
}