/**
 * Migración: añade soporte criptográfico PKI al esquema existente.
 *
 * Ejecutar UNA SOLA VEZ:
 *   node src/migrations/cripto.js
 */

const { sequelize } = require('../config/database');

async function migrar() {
  const q = (sql) => sequelize.query(sql);

  console.log('Aplicando migración criptográfica...');

  // ── Tabla usuario: nuevas columnas ──────────────────────────────────────
  await q(`
    ALTER TABLE usuario
      ADD COLUMN IF NOT EXISTS ecdsaPublicKey TEXT NULL,
      ADD COLUMN IF NOT EXISTS clavesGeneradas TINYINT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS certificadoSerial VARCHAR(36) NULL;
  `);
  console.log('✓ Columnas crypto agregadas a usuario');

  // ── Tabla contrato_digital ──────────────────────────────────────────────
  await q(`
    CREATE TABLE IF NOT EXISTS contrato_digital (
      idContratoDigital              INT AUTO_INCREMENT PRIMARY KEY,
      arrendamiento_idArrendamiento  INT NOT NULL UNIQUE,
      pdfBytes                       LONGBLOB NOT NULL,
      pdfHash                        VARCHAR(64) NOT NULL,
      firmaArrendador                TEXT NULL,
      firmaArrendatario              TEXT NULL,
      certSerialArrendador           VARCHAR(36) NULL,
      certSerialArrendatario         VARCHAR(36) NULL,
      estadoFirma                    ENUM('pendiente_arrendador','pendiente_arrendatario','completo')
                                     NOT NULL DEFAULT 'pendiente_arrendador',
      fechaCreacion                  DATETIME NOT NULL,
      fechaFirmaArrendador           DATETIME NULL,
      fechaFirmaArrendatario         DATETIME NULL,
      CONSTRAINT fk_cd_arrendamiento
        FOREIGN KEY (arrendamiento_idArrendamiento)
        REFERENCES arrendamiento(idArrendamiento)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✓ Tabla contrato_digital creada');

  console.log('\n¡Migración completada exitosamente!');
  process.exit(0);
}

migrar().catch(err => {
  console.error('Error en migración:', err.message);
  process.exit(1);
});
