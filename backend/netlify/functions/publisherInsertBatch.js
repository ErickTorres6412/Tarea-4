"use strict"

const sql = require('./neonDB');
const headers = require('./headersCORS');

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    const d = JSON.parse(event.body);

    await sql`INSERT INTO publishers (id, publisher, country, founded, genere, books)
      VALUES (${parseInt(d.id)},
       ${d.publisher ?? null}, ${d.country ?? null}, ${d.founded ?? null}, ${d.genere ?? null},
       ${JSON.stringify(d.books ?? [])}::jsonb)`;

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify(error.message) };
  }
};
