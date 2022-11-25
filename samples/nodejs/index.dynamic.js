/*
For this to work you need to pass the actual
function handler as an environment variable

See https://www.npmjs.com/package/serverless-offline-lambda-docker-plugin for further information
*/

const handler = async (aws_event, lambda_context) => {
    const realEvtHandler = process.env.REAL_EVT_HANDLER;

    const functionName = realEvtHandler.split('.').pop()

    const modulePath = realEvtHandler.match(/(.*)\./)[1] + '.js'
    const loadedModule = await import(modulePath)

    return loadedModule[functionName](aws_event, lambda_context)
}

module.exports.handler = handler