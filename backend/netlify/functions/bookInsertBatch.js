"use strict"

const sql = require('./neonDB');
const headers = require('./headersCORS');

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    const d = JSON.parse(event.body);

    await sql`INSERT INTO books
      (id, title, edition, copyright, language, pages,
       author, author_id, publisher, publisher_id)
      VALUES (${parseInt(d.id)}, ${d.title ?? null}, ${d.edition ?? null},
       ${d.copyright ?? null}, ${d.language ?? null}, ${d.pages ?? null},
       ${d.author ?? null}, ${d.author_id ?? null},
       ${d.publisher ?? null}, ${d.publisher_id ?? null})`;

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify(error.message) };
  }
};
