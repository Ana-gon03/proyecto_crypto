import React from 'react'

const SubirDocumento = ({ tipo, onFileSelect, file, setFile, required, label }) => {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      onFileSelect(selectedFile)
    } else {
      alert('Solo se permiten archivos PDF')
    }
  }

  return (
    <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '5px' }}>
      <label>
        {label || (tipo === 'constancia' ? 'Constancia de Estudios (PDF)' : 'Documento CURP (PDF)')}
        {required && <span style={{ color: 'red' }}> *</span>}
      </label>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        required={required && !file}
        style={{ display: 'block', marginTop: '0.5rem' }}
      />

      {file && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'green' }}>
          ✅ Archivo seleccionado: {file.name}
        </div>
      )}
    </div>
  )
}

export default SubirDocumento