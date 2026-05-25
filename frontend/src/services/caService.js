import api from './api'

const headers = () => ({
  'x-user-id': localStorage.getItem('userId') || '',
})

export const solicitarCertificado = (publicKeySpki) =>
  api.post('/ca/solicitar-certificado', { publicKeySpki }, { headers: headers() })
    .then(r => r.data)

export const getMiCertificado = () =>
  api.get('/ca/mi-certificado', { headers: headers() }).then(r => r.data)

export const validarCertificado = (serial) =>
  api.post(`/ca/validar/${serial}`, {}, { headers: headers() }).then(r => r.data)

export const getCAInfo = () =>
  api.get('/ca/info').then(r => r.data)
