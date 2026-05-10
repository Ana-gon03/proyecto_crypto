import React from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedArrendadorRoute = ({ children }) => {
  const userId = localStorage.getItem('userId')
  const rol = localStorage.getItem('rol')
  const correoVerificado = localStorage.getItem('correoVerificado')

  if (!userId || rol !== 'arrendador' || correoVerificado !== '1') {
    return <Navigate to="/usuarios/inicio-sesion" replace />
  }

  return children
}

export default ProtectedArrendadorRoute