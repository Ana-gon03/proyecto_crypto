/**
 * Importa CatalogoCodigosPostales.txt a Railway MySQL.
 * Ejecutar: node importCP.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Credenciales de Railway MySQL
const DB_CONFIG = {
  host: 'ballast.proxy.rlwy.net',
  port: 21563,
  user: 'root',
  password: 'VUCFBsUqztvwesBEIPGbBtJwFjTGKItv',
  database: 'vivienda_upalm',
  connectTimeout: 30000,
};

const FILE_PATH = path.join(__dirname, '..', 'db', 'CatalogoCodigosPostales.txt');
const BATCH_SIZE = 500;

async function main() {
  console.log('Leyendo archivo...');
  const content = fs.readFileSync(FILE_PATH, 'latin1');
  const lines = content.split('\n');

  // Línea 0: nota de copyright, Línea 1: encabezado → datos desde línea 2
  const dataLines = lines.slice(2).map(l => l.trim()).filter(l => l.length > 0);
  console.log(`Total filas a insertar: ${dataLines.length}`);

  console.log('Conectando a Railway MySQL...');
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Conectado.\n');

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
    const batch = dataLines.slice(i, i + BATCH_SIZE);
    const placeholders = [];
    const values = [];

    for (const line of batch) {
      const cols = line.split('|');
      if (cols.length < 15) { skipped++; continue; }

      // 15 columnas: d_codigo, d_asenta, d_tipo_asenta, D_mnpio, d_estado,
      //              d_ciudad, d_CP, c_estado, c_oficina, c_CP,
      //              c_tipo_asenta, c_mnpio, id_asenta_cpcons, d_zona, c_cve_ciudad
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (let c = 0; c < 15; c++) {
        const val = cols[c].trim();
        values.push(val === '' ? null : val);
      }
    }

    if (placeholders.length === 0) continue;

    const sql = `
      INSERT INTO cp
        (d_codigo, d_asenta, d_tipo_asenta, D_mnpio, d_estado,
         d_ciudad, d_CP, c_estado, c_oficina, c_CP,
         c_tipo_asenta, c_mnpio, id_asenta_cpcons, d_zona, c_cve_ciudad)
      VALUES ${placeholders.join(', ')}
    `;

    await conn.execute(sql, values);
    inserted += placeholders.length;
    process.stdout.write(`\rInsertadas: ${inserted} / ${dataLines.length}  (omitidas: ${skipped})`);
  }

  console.log('\n\nImportación completada.');
  console.log(`  Insertadas: ${inserted}`);
  console.log(`  Omitidas:   ${skipped}`);

  await conn.end();
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
