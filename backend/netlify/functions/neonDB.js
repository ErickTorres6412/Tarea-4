"use strict";

const { neon } = require('@neondatabase/serverless');
const { getConnectionString } = require('@netlify/database');

// En Netlify la base (Neon) la aprovisiona Netlify Database, que define
// NETLIFY_DB_URL. DATABASE_URL permite usar otra base de Neon si se desea.
module.exports = neon(process.env.DATABASE_URL || getConnectionString());
