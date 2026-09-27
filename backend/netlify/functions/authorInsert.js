"use strict"

const headers = require('./headersCORS');

const rabbitPromise = require('./rabbitMQ');

const queue = "authors";

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return {statusCode: 200,headers,body: "OK"};
  }

  try {
    const channel = await rabbitPromise();
    await channel.assertQueue(queue, {durable: true});
    const request = JSON.stringify({method: 'INSERT', body: JSON.parse(event.body)});
    channel.sendToQueue(queue, Buffer.from(request), {persistent: true});
    await channel.waitForConfirms();
    await channel.close();

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify(error.message) };
  }
};
