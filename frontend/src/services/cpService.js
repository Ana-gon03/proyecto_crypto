import api from './api';

export const buscarCP = async (cp) => {
  const response = await api.get(`/cp/buscar/${cp}`);
  return response.data;
};

export const obtenerDireccionesPorCP = async (cp) => {
  const response = await api.get(`/cp/direcciones/${cp}`);
  return response.data;
};