const axios = require('axios');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmail = async (to, subject, htmlContent) => {
  await axios.post(BREVO_URL, {
    sender: { email: process.env.BREVO_EMAIL_SENDER, name: 'Burroomies' },
    to: [{ email: to }],
    subject,
    htmlContent,
  }, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
};

const enviarCodigoVerificacion = async (destinatario, codigo, nombre) => {
  try {
    await sendEmail(
      destinatario,
      'Verifica tu cuenta - Burroomies',
      `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Verifica tu cuenta</title></head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #5e60ce; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #5e60ce; margin: 0;">🏠 Burroomies</h1>
            <p style="color: #666; margin: 5px 0 0;">Vivienda para estudiantes IPN</p>
          </div>
          <h2 style="color: #333;">¡Bienvenido a Burroomies, ${nombre}!</h2>
          <p style="color: #555; line-height: 1.5;">Gracias por registrarte. Para completar tu registro ingresa el siguiente código:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 36px; letter-spacing: 8px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
            ${codigo}
          </div>
          <p style="color: #555;">Este código expira en <strong>24 horas</strong>.</p>
          <p style="color: #555;">Si no solicitaste este registro, puedes ignorar este correo.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            Burroomies - Plataforma de vivienda para estudiantes del IPN<br>
            Este es un correo automático, por favor no responder.
          </p>
        </div>
      </body>
      </html>
      `
    );
    console.log('✅ Correo enviado a:', destinatario);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error.response?.data || error.message);
    return false;
  }
};

const reenviarCodigoVerificacion = async (destinatario, codigo, nombre) => {
  return await enviarCodigoVerificacion(destinatario, codigo, nombre);
};

const enviarCorreoContacto = async (nombre, email, mensaje) => {
  try {
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `📩 Nuevo mensaje de contacto - ${nombre}`,
      `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 20px;">
          <h1 style="color: #5e60ce;">🏠 Burroomies — Contacto</h1>
          <p><strong>De:</strong> ${nombre}</p>
          <p><strong>Correo:</strong> ${email}</p>
          <hr />
          <p><strong>Mensaje:</strong></p>
          <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">${mensaje}</p>
        </div>
      </body>
      </html>
      `
    );
    console.log('✅ Correo de contacto enviado');
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo de contacto:', error.response?.data || error.message);
    return false;
  }
};

module.exports = {
  enviarCodigoVerificacion,
  reenviarCodigoVerificacion,
  enviarCorreoContacto,
};
