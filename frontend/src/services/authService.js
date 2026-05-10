// src/services/authService.js
import api from './api';
import { limpiarClavesPrivadas } from './cryptoService';

// Validar campo (correo, username, boleta, curp)
export const validarCampo = async (campo, valor) => {
  const response = await api.post('/auth/validar-campo', { campo, valor });
  return response.data;
};

// Registro de estudiante
export const registrarEstudiante = async (datos) => {
  const response = await api.post('/auth/registro-estudiante', datos);
  return response.data;
};

// Registro de arrendador
export const registrarArrendador = async (datos) => {
  const response = await api.post('/auth/registro-arrendador', datos);
  return response.data;
};

// Reenviar código de verificación
export const reenviarCodigo = async (correo) => {
  const response = await api.post('/auth/reenviar-codigo', { correo });
  return response.data;
};

// Verificar código (registro)
export const verificarCodigo = async (correo, codigo) => {
  const response = await api.post('/auth/verificar-codigo', { correo, codigo });
  return response.data;
};

// Verificar código (post-login)
export const verificarCodigoLogin = async (correo, codigo) => {
  const response = await api.post('/auth/verificar-correo-login', { correo, codigo });
  return response.data;
};

// Actualizar correo (si se equivocó)
export const actualizarCorreo = async (correoAnterior, nuevoCorreo) => {
  const response = await api.post('/auth/actualizar-correo', { correoAnterior, nuevoCorreo });
  return response.data;
};

// Login de usuarios (arrendador y arrendatario)
export const loginUsuario = async (correo, password) => {
  const response = await api.post('/auth/login-usuario', { correo, password });
  return response.data;
};

// Verificar expiración de cuenta (60 días)
export const verificarExpiracion = async (userId) => {
  const response = await api.post('/auth/verificar-expiracion', { userId });
  return response.data;
};

// Login de administrador
export const loginAdmin = async (adminUser, adminContra) => {
  const response = await api.post('/auth/login-admin', { adminUser, adminContra });
  return response.data;
};

// Obtener perfil del arrendador
export const getPerfilArrendador = async (idUsuario) => {
  const response = await api.get(`/auth/perfil-arrendador/${idUsuario}`);
  return response.data;
};

// Actualizar perfil del arrendador
export const actualizarPerfilArrendador = async (idUsuario, datos) => {
  const response = await api.put(`/auth/perfil-arrendador/${idUsuario}`, datos);
  return response.data;
};

// ========== LOGOUT con limpieza de claves criptográficas ==========
export const logout = () => {
  limpiarClavesPrivadas();  // elimina la clave privada de sessionStorage
  localStorage.clear();
  sessionStorage.clear();   // por si quedó algo extra
};