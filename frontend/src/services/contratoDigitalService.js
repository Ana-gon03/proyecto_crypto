import api from './api'

const headers = () => ({
  'x-user-id':        localStorage.getItem('userId') || '',
  'x-arrendador-id':  localStorage.getItem('arrendadorId') || '',
  'x-arrendatario-id': localStorage.getItem('arrendatarioId') || '',
})

export const iniciarContrato = (idArrendamiento) =>
  api.post(`/contratos-digitales/${idArrendamiento}/iniciar`, {}, { headers: headers() })
    .then(r => r.data)

export const getContrato = (idArrendamiento) =>
  api.get(`/contratos-digitales/${idArrendamiento}`, { headers: headers() })
    .then(r => r.data)

export const getPdfUrl = (idArrendamiento) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  return `${base}/contratos-digitales/${idArrendamiento}/pdf`
}

export const getPdfBuffer = async (idArrendamiento) => {
  const url = getPdfUrl(idArrendamiento)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('Error al descargar el PDF')
  return resp.arrayBuffer()
}

export const firmarComoArrendador = (idArrendamiento, firmaBase64, certSerial) =>
  api.post(`/contratos-digitales/${idArrendamiento}/firmar-arrendador`,
    { firmaBase64, certSerial }, { headers: headers() }).then(r => r.data)

export const firmarComoArrendatario = (idArrendamiento, firmaBase64, certSerial) =>
  api.post(`/contratos-digitales/${idArrendamiento}/firmar-arrendatario`,
    { firmaBase64, certSerial }, { headers: headers() }).then(r => r.data)

export const verificarContrato = (idArrendamiento) =>
  api.post(`/contratos-digitales/${idArrendamiento}/verificar`, {}, { headers: headers() })
    .then(r => r.data)
