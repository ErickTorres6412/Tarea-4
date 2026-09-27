"use strict"

const sql = require('./neonDB');
const headers = require('./headersCORS');

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    const id = parseInt(event.path.split("/").reverse()[0]);
    const d = JSON.parse(event.body);

    // COALESCE: los campos que no vienen en el mensaje conservan su valor
    await sql`UPDATE authors SET
      author = COALESCE(${d.author ?? null}, author),
      nationality = COALESCE(${d.nationality ?? null}, nationality),
      birth_year = COALESCE(${d.birth_year ?? null}, birth_year),
      fields = COALESCE(${d.fields ?? null}, fields),
      books = COALESCE(${d.books ? JSON.stringify(d.books) : null}::jsonb, books)
      WHERE id = ${id}`;

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify(error.message) };
  }
};
