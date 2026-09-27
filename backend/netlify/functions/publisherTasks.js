"use strict"

const rabbitPromise = require('./rabbitMQ');

const headers = require('./headersCORS');

const queue = "publishers";

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  // Direccion del propio sitio: Netlify define URL (en local, netlify dev)
  const url = (process.env.URL || 'https://' + event.headers.host) + '/.netlify/functions/';

  try {
    const channel = await rabbitPromise();
    await channel.assertQueue(queue, {durable: true});
    let processed = 0;
    let message = await channel.get(queue,{'noAck':true});
    while (message) {
      const request = JSON.parse(message.content.toString());
      let response;
      switch (request.method) {
        case "DELETE":
          response = await fetch(url+'publisherDeleteBatch/'+request.id, {
            method: "DELETE",
            headers: {"Content-type": "application/json"}});
          break;
        case "UPDATE":
          response = await fetch(url+'publisherUpdateBatch/'+request.id, {
            headers: {"Content-type": "application/json"},
            method: "PUT", body: JSON.stringify(request.body)});
          break;
        case "INSERT":
          response = await fetch(url+'publisherInsertBatch', {
            headers: {"Content-type": "application/json"},
            method: "POST",body: JSON.stringify(request.body)});
          break;
      }
      if (response && !response.ok)
        console.log(request.method, 'failed:', await response.text());
      processed++;
      message = await channel.get(queue,{'noAck':true});
    }
    await channel.close();
    return { statusCode: 200, headers, body: JSON.stringify({processed})};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify(error.message) };
  }
};
