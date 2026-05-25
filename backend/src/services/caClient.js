/**
 * Cliente HTTP para comunicarse con el servicio de la CA.
 * El backend llama a la CA a través de este módulo.
 */

const axios = require('axios');

const CA_URL    = process.env.CA_SERVICE_URL || 'http://localhost:5001';
const CA_SECRET = process.env.CA_API_SECRET  || '';

const caHttp = axios.create({
  baseURL: CA_URL,
  headers: { 'x-ca-secret': CA_SECRET },
  timeout: 10000,
});

async function emitirCertificado({ usuarioId, nombreCompleto, correo, rol, publicKeySpki }) {
  const { data } = await caHttp.post('/api/ca/certificados/emitir', {
    usuarioId, nombreCompleto, correo, rol, publicKeySpki,
  });
  return data;
}

async function validarCertificado(serial) {
  const { data } = await caHttp.post(`/api/ca/certificados/${serial}/validar`);
  return data;
}

async function obtenerCertificado(serial) {
  const { data } = await caHttp.get(`/api/ca/certificados/${serial}`);
  return data;
}

async function obtenerCertificadoDeUsuario(usuarioId) {
  const { data } = await caHttp.get(`/api/ca/certificados/usuario/${usuarioId}`);
  return data;
}

async function revocarCertificado(serial) {
  const { data } = await caHttp.put(`/api/ca/certificados/${serial}/revocar`);
  return data;
}

async function getCAInfo() {
  const { data } = await caHttp.get('/api/ca/info');
  return data;
}

module.exports = {
  emitirCertificado,
  validarCertificado,
  obtenerCertificado,
  obtenerCertificadoDeUsuario,
  revocarCertificado,
  getCAInfo,
};
