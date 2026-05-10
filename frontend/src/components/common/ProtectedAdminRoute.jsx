import React from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedAdminRoute = ({ children }) => {
  const adminUser = localStorage.getItem('adminUser')
  
  if (!adminUser) {
    return <Navigate to="/admin/inicio-sesion" replace />
  }
  
  return children
}

export default ProtectedAdminRoute