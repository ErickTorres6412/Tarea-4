"use strict";

const amqp = require('amqplib');

// La conexion se reutiliza mientras la funcion siga "caliente"; asi no se
// abre una conexion nueva por invocacion (el plan gratuito de CloudAMQP
// limita la cantidad de conexiones simultaneas).
let connection = null;

module.exports = async() => {
  if (!connection) {
    connection = amqp.connect(process.env.CLOUDAMQP_URL);
    const conn = await connection.catch((error) => {
      connection = null;
      throw error;
    });
    conn.on('close', () => { connection = null; });
    conn.on('error', () => { connection = null; });
  }
  const conn = await connection;
  // Canal con confirmaciones: permite esperar a que el broker reciba el
  // mensaje antes de que la funcion termine.
  const channel = await conn.createConfirmChannel();
  return channel;
}
