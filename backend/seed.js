"use strict";

// Crea las tablas y carga los datos iniciales ejecutando schema.sql en Neon.
// Uso: crear .env con DATABASE_URL y ejecutar "npm run seed".
// (Alternativa: pegar schema.sql en el SQL Editor de la consola de Neon.)

const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const statements = fs.readFileSync(__dirname + '/schema.sql', 'utf8')
    .split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  for (const table of ['books', 'authors', 'publishers']) {
    const rows = await sql.query(`SELECT count(*) FROM ${table}`);
    console.log(`${table}: ${rows[0].count} filas`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
