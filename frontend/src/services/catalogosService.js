import api from './api';

export const getUnidadesAcademicas = async () => {
  const response = await api.get('/catalogos/unidades-academicas');
  return response.data;
};

export const getCarrerasByUnidad = async (idUnidadAcademica) => {
  const response = await api.get(`/catalogos/carreras/${idUnidadAcademica}`);
  return response.data;
};

export const getAllCarreras = async () => {
  const response = await api.get('/catalogos/carreras');
  return response.data;
};