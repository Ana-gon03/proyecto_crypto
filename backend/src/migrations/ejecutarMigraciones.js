// Ejecuta las tres migraciones del módulo criptográfico.
// Correr una sola vez: node src/migrations/ejecutarMigraciones.js
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ejecutarMigraciones = async () => {
  const qi = sequelize.getQueryInterface();

  // ── 1. COLUMNAS EN TABLA usuario ──────────────────────────────────────────
  const columsUsuario = await qi.describeTable('usuario');

  if (!columsUsuario.ecdsaPublicKey) {
    await qi.addColumn('usuario', 'ecdsaPublicKey', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    console.log('✅  usuario.ecdsaPublicKey agregada');
  }

  if (!columsUsuario.ecdhPublicKey) {
    await qi.addColumn('usuario', 'ecdhPublicKey', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    console.log('✅  usuario.ecdhPublicKey agregada');
  }

  if (!columsUsuario.clavesGeneradas) {
    await qi.addColumn('usuario', 'clavesGeneradas', {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
    });
    console.log('✅  usuario.clavesGeneradas agregada');
  }

  // ── 2. TABLA contrato ─────────────────────────────────────────────────────
  const tablas = await qi.showAllTables();

  if (!tablas.includes('contrato')) {
    await qi.createTable('contrato', {
      idContrato: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      arrendamiento_idArrendamiento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'arrendamiento', key: 'idArrendamiento' },
        onDelete: 'CASCADE',
      },
      contratoCifrado: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
      },
      contratoHashDocumento: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      contratoFirmaArrendador: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contratoFirmaArrendatario: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contratoEstado: {
        type: DataTypes.ENUM('pendiente', 'firmado', 'aceptado', 'rechazado'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      contratoFechaCreacion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
    console.log('✅  Tabla contrato creada');
  }

  // ── 3. TABLA sesion_ecdh ──────────────────────────────────────────────────
  if (!tablas.includes('sesion_ecdh')) {
    await qi.createTable('sesion_ecdh', {
      idSesionECDH: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      usuario_idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'usuario', key: 'idUsuario' },
        onDelete: 'CASCADE',
      },
      publicKeyEfimera: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
    console.log('✅  Tabla sesion_ecdh creada');
  }

  console.log('✅  Todas las migraciones completadas');
  await sequelize.close();
};

ejecutarMigraciones().catch((err) => {
  console.error('❌ Error en migraciones:', err);
  process.exit(1);
});
