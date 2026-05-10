'use strict';
const crypto = require('crypto');

/**
 * Calcula el hash SHA-256 de un Buffer y lo devuelve como string hexadecimal.
 * @param {Buffer} buffer
 * @returns {string} 64 caracteres hexadecimales
 */
const calcularSHA256 = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex');

module.exports = { calcularSHA256 };
