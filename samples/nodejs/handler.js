'use strict';

/*

This shows how your "normal" handler would look like. 

See index.dynamic.js for an example on how the "docker" handler should look like.

See https://www.npmjs.com/package/serverless-offline-lambda-docker-plugin for further information

*/

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v3.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };
};