import React, { useState } from 'react'
import NavbarInicio from '../../components/common/NavbarInicio'
import FooterInicio from '../../components/common/FooterInicio'

const FaqPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  })
  const [enviando, setEnviando] = useState(false)
  const [mensajeEnviado, setMensajeEnviado] = useState(false)
  const [error, setError] = useState('')

  const preguntas = [
    {
      pregunta: '¿Cómo me registro como estudiante?',
      respuesta: 'Debes ir a la página de Registro, seleccionar "Estudiante IPN", llenar todos tus datos personales y académicos, y crear una contraseña segura. También puedes subir tu constancia de estudios para verificar tu identidad más rápido.'
    },
    {
      pregunta: '¿Cómo me registro como arrendador?',
      respuesta: 'Debes ir a la página de Registro, seleccionar "Arrendador", llenar tus datos personales, tu domicilio (el CP se autocompleta) y subir tu documento CURP en PDF para validar tu identidad.'
    },
    {
      pregunta: '¿Qué pasa si no verifico mi cuenta?',
      respuesta: 'Si no verificas tu cuenta a través del código enviado a tu correo, no podrás acceder al sistema. Tienes 24 horas para ingresar el código de verificación.'
    },
    {
      pregunta: '¿Qué pasa si no verifico mi identidad con documento?',
      respuesta: 'Si eres estudiante y decides postergar la verificación con constancia, tendrás 2 meses para hacerlo. Pasado ese tiempo, tu cuenta será eliminada. Para arrendadores, la verificación con CURP es obligatoria al momento del registro.'
    },
    {
      pregunta: '¿Cómo busco una propiedad?',
      respuesta: 'Una vez que inicies sesión como estudiante, podrás buscar propiedades por ubicación, precio, tipo de propiedad o servicios incluidos.'
    },
    {
      pregunta: '¿Cómo contacto al arrendador?',
      respuesta: 'Dentro de cada publicación de propiedad encontrarás la información de contacto del arrendador (teléfono y correo).'
    },
    {
      pregunta: '¿Qué hago si olvidé mi contraseña?',
      respuesta: 'En la pantalla de inicio de sesión hay un enlace para recuperar tu contraseña. Se te enviará un correo con instrucciones para restablecerla.'
    },
    {
      pregunta: '¿Las reseñas son obligatorias?',
      respuesta: 'No son obligatorias, pero ayudan a otros estudiantes a tomar mejores decisiones y a los arrendadores a mejorar sus servicios.'
    }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')

    if (!formData.nombre || !formData.email || !formData.mensaje) {
      setError('Por favor, llena todos los campos')
      setEnviando(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Ingresa un correo electrónico válido')
      setEnviando(false)
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMensajeEnviado(true)
        setFormData({ nombre: '', email: '', mensaje: '' })
      } else {
        setError('Error al enviar el mensaje. Intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarInicio />
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>❓ Preguntas Frecuentes</h1>
        
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }}>
          {preguntas.map((item, index) => (
            <div key={index} style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '1rem', 
              borderRadius: '8px',
              borderLeft: '4px solid #5e60ce'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{item.pregunta}</h3>
              <p style={{ margin: 0, color: '#666', lineHeight: '1.5' }}>{item.respuesta}</p>
            </div>
          ))}
        </div>

        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '2rem', 
          borderRadius: '10px',
          marginTop: '2rem'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>📧 ¿No encontraste lo que buscabas?</h2>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
            Escríbenos directamente y te responderemos lo antes posible
          </p>

          {mensajeEnviado ? (
            <div style={{ 
              backgroundColor: '#d4edda', 
              color: '#155724', 
              padding: '1rem', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              ✅ ¡Mensaje enviado! Te responderemos a la brevedad.
              <br />
              <button 
                onClick={() => setMensajeEnviado(false)}
                style={{ marginTop: '0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.3rem 1rem', borderRadius: '3px', cursor: 'pointer' }}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
              {error && (
                <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '0.5rem', borderRadius: '5px', marginBottom: '1rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Tu nombre:</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Tu correo:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Mensaje:</label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="4"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Escribe tu pregunta o comentario aquí..."
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#5e60ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  opacity: enviando ? 0.7 : 1
                }}
              >
                {enviando ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </form>
          )}
        </div>
      </main>
      <FooterInicio />
    </div>
  )
}

export default FaqPage