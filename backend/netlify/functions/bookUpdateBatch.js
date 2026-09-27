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
    await sql`UPDATE books SET
      title        = COALESCE(${d.title ?? null}, title),
      edition      = COALESCE(${d.edition ?? null}, edition),
      copyright    = COALESCE(${d.copyright ?? null}, copyright),
      language     = COALESCE(${d.language ?? null}, language),
      pages        = COALESCE(${d.pages ?? null}, pages),
      author       = COALESCE(${d.author ?? null}, author),
      author_id    = COALESCE(${d.author_id ?? null}, author_id),
      publisher    = COALESCE(${d.publisher ?? null}, publisher),
      publisher_id = COALESCE(${d.publisher_id ?? null}, publisher_id)
      WHERE id = ${id}`;

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify(error.message) };
  }
};
