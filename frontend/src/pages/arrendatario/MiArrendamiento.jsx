// src/pages/arrendatario/MiArrendamiento.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarArrendatario from '../../components/common/NavbarArrendatario';
import FooterInicio from '../../components/common/FooterInicio';
import ModalContrato from '../../components/common/ModalContrato';
import { obtenerContratoPorArrendamiento, firmarContrato, obtenerClavePublicaUsuario } from '../../services/contratoService';
import { getPrivateKey, derivarClaveAES, descifrarAES, firmarECDSA } from '../../services/cryptoService';

const MiArrendamiento = () => {
  const navigate = useNavigate();
  const [arrendamiento, setArrendamiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [esperandoArrendador, setEsperandoArrendador] = useState(false);

  // Estados para modal de contrato
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false);
  const [contratoDescifrado, setContratoDescifrado] = useState('');
  const [contratoId, setContratoId] = useState(null);
  const [firmando, setFirmando] = useState(false);

  useEffect(() => {
    cargarArrendamiento();
  }, []);

  const cargarArrendamiento = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const arrendatarioId = localStorage.getItem('arrendatarioId');

      const arrendatarioVerificado = localStorage.getItem('arrendatarioVerificado');
      if (arrendatarioVerificado === 'false' || arrendatarioVerificado === '0') {
        navigate('/arrendatario/verificacion-pendiente');
        return;
      }

      if (!userId || !arrendatarioId) {
        setError('No has iniciado sesión');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/arrendamientos/mi-arrendamiento', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        }
      });

      if (response.status === 404) {
        setArrendamiento(null);
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error('Error al cargar');

      const data = await response.json();
      setArrendamiento(data);
      if (data.arrendamientoValEstudiante === 1) {
        setEsperandoArrendador(true);
      }
    } catch (err) {
      setError('No se pudo cargar tu arrendamiento');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerContrato = async () => {
    try {
      if (!arrendamiento) return;
      const contratoData = await obtenerContratoPorArrendamiento(arrendamiento.idArrendamiento);
      setContratoId(contratoData.idContrato);

      // Obtener clave pública del arrendador
      const publicKeyArrendador = await obtenerClavePublicaUsuario(contratoData.llavePub_idArrendador);

      // Obtener clave privada del arrendatario
      const privateKey = await getPrivateKey();

      // Derivar clave AES
      const aesKey = await derivarClaveAES(privateKey, publicKeyArrendador);

      // Descifrar contrato
      const textoPlano = await descifrarAES(
        contratoData.contratoCifrado,
        contratoData.contratoIV,
        contratoData.contratoAuthTag,
        aesKey
      );

      setContratoDescifrado(textoPlano);
      setMostrarModalContrato(true);
    } catch (err) {
      alert('Error al cargar el contrato: ' + err.message);
      console.error(err);
    }
  };

  const handleFirmarContrato = async () => {
    setFirmando(true);
    try {
      const privateKey = await getPrivateKey();
      const firma = await firmarECDSA(contratoDescifrado, privateKey);
      await firmarContrato(contratoId, firma);
      alert('✅ Contrato firmado exitosamente');
      setMostrarModalContrato(false);
      cargarArrendamiento(); // recargar para actualizar estado
    } catch (err) {
      alert('Error al firmar: ' + err.message);
    } finally {
      setFirmando(false);
    }
  };

  const handleDescargarContrato = () => {
    window.open(`http://localhost:5000/api/arrendamientos/${arrendamiento.idArrendamiento}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#666' }}>Cargando arrendamiento...</p>
        </div>
        <FooterInicio />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: '#ffe6e6', color: '#dc3545', borderRadius: '5px', textAlign: 'center' }}>
            {error}
          </div>
        </div>
        <FooterInicio />
      </div>
    );
  }

  if (!arrendamiento) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', maxWidth: '600px', margin: '2rem auto' }}>
          <p style={{ fontSize: '60px', marginBottom: '15px' }}>🏠</p>
          <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>No tienes un arrendamiento activo</h2>
          <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>Cuando un arrendador te asigne una propiedad, aparecerá aquí.</p>
          <button onClick={() => navigate('/arrendatario/buscar-vivienda')} style={{ padding: '12px 30px', backgroundColor: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>🔍 Buscar Vivienda</button>
        </div>
        <FooterInicio />
      </div>
    );
  }

  const propiedad = arrendamiento.propiedad;
  const arrendador = propiedad?.arrendador?.usuario;
  const nombreArrendador = arrendador ? `${arrendador.usuarioNom} ${arrendador.usuarioApePat} ${arrendador.usuarioApeMat || ''}`.trim() : 'No disponible';
  const primeraFoto = propiedad?.fotos?.[0]?.fotosURL || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendatario />
      <div style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '20px', width: '100%' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>📋 Mi Arrendamiento</h1>

        {esperandoArrendador && (
          <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '30px', margin: '0 0 10px 0' }}>⏳</p>
            <p style={{ fontWeight: 'bold', color: '#856404', margin: '0 0 8px 0', fontSize: '16px' }}>Esperando confirmación del arrendador</p>
            <p style={{ color: '#856404', fontSize: '14px', margin: 0 }}>Ya has finalizado tu parte. El contrato seguirá disponible hasta que el arrendador confirme.</p>
          </div>
        )}

        <div style={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ height: '250px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {primeraFoto ? (
              <img src={`http://localhost:5000${primeraFoto}`} alt={propiedad?.propiedadTitulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '60px' }}>🏠</span>
            )}
            <span style={{ position: 'absolute', top: '15px', left: '15px', padding: '6px 15px', backgroundColor: '#28a745', color: 'white', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold' }}>✅ Activo</span>
          </div>

          <div style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', color: '#333' }}>{propiedad?.propiedadTitulo || 'Propiedad'}</h2>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{propiedad?.propiedadTipo} · {propiedad?.direccion?.colonia}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 'bold', fontSize: '24px', color: '#1a237e' }}>${arrendamiento.arrendamientoRenta?.toLocaleString('es-MX') || '0'}</span>
                <span style={{ fontSize: '13px', color: '#999', display: 'block' }}>MXN / mes</span>
              </div>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', marginBottom: '20px' }}>
              <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>{propiedad?.propiedadDescripcion || 'Sin descripción'}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '20px' }}>
              <button onClick={handleDescargarContrato} style={{ flex: 1, padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>📄 Descargar Contrato</button>
              <button onClick={handleVerContrato} style={{ flex: 1, padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>🔓 Ver y Firmar Contrato</button>
            </div>

            <hr style={{ margin: '0 0 20px 0' }} />

            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>👤 Arrendador</h3>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#1a237e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>{nombreArrendador.charAt(0)}</div>
              <div><strong style={{ fontSize: '15px' }}>{nombreArrendador}</strong></div>
            </div>
            <div style={{ paddingLeft: '10px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>📧 Correo: {arrendador?.usuarioCorreo || 'No disponible'}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>📞 Teléfono: {arrendador?.usuarioTel || 'No disponible'}</p>
            </div>
          </div>
        </div>
      </div>
      <FooterInicio />

      {mostrarModalContrato && (
        <ModalContrato
          contratoTexto={contratoDescifrado}
          onFirmar={handleFirmarContrato}
          onCerrar={() => setMostrarModalContrato(false)}
          firmando={firmando}
        />
      )}
    </div>
  );
};

export default MiArrendamiento;