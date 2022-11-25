	
'use strict';
const process = require('process')

const logPrefix = 'ServerlessOfflineLambdaDockerPlugin: '
const exit = (exitCode = 0) => {
    return process.exit(exitCode)
}

class ServerlessOfflineLambdaDockerPlugin {
  constructor(serverless) {
    this.provider = serverless.getProvider('aws')
    this.serverless = serverless

    this.config = this.getConfig();

    if (this.config.notConfigured) {
        console.warn(`${logPrefix}: The ServerlessOfflineLambdaDockerPlugin was not configured. Read https://github.com/nicoandra/serverless-offline-lambda-docker-plugin/blob/main/README.md for instructions.`)
    }

    serverless.configSchemaHandler.defineCustomProperties({
        type: 'object',
        properties: {
            serverlessOfflineLambdaDocker: {
                type: 'object',
                properties: {
                    enabled: {type: "boolean"},
                    enableTransitionSuffix: {type: "boolean"},
                    dockerImage: {type: "string"},
                    localStages: {type: "array", items: { type: "string"}},
                    functionsToSkip: {type: "array", items: { type: "string"}},
                },
                required: ['dockerImage', 'localStages', 'enabled']
            },
        },
    });

    this.hooks = {
        'initialize': () => this.init(),
        'before:package:initialize': () => this.beforePackage(),
    };
  }

  init() {
    if(this.config.enabled === false) {
        console.warn(`${logPrefix}: ServerlessOfflineLambdaDockerPlugin is disabled.`);
        return ;
    }

    if (!this.config.dockerImage) {
        console.error(`${logPrefix}: plugin is enabled, but the dockerImage parameter is not set. Exiting.`);
        exit(1);
    }

    if (!this.config.localStages || !this.config.localStages.length) {
        console.warn(`${logPrefix}: plugin is enabled, but no stage has been selected. Skipping.`);
        this.config.enabled = false;
        return
    }

    if (this.config.localStages.some(x => x === this.serverless.service.provider.stage)){
        console.info(`${logPrefix}: plugin won't make any change for stage ${this.serverless.service.provider.stage}`);
        this.config.enabled = false;
        return
    }
  }

  beforePackage() {
    if(!this.config.enabled) {
        console.log(`${logPrefix}: plugin disabled.`)
        return;
    }
    
    const functionsToSkip = this.config.functionsToSkip || []
    for(let functionKey in this.serverless.service.functions) {
        if (functionsToSkip.some(x => x === functionKey)) {
            continue;
        }

        const functionDefinition = this.serverless.service.functions[functionKey]

        if(!functionDefinition.handler) {
            // this function does not have a handler, skip it
            continue;
        }
        if (!functionDefinition.environment) functionDefinition.environment = {}

        functionDefinition.environment['REAL_EVT_HANDLER'] = functionDefinition.handler;
        delete functionDefinition.handler;
        functionDefinition.image = this.config.dockerImage
        this.serverless.service.functions[functionKey] = functionDefinition
        if (this.config.enableTransitionSuffix) {
            const newFunctionKey = `${functionKey}Dckr`;
            console.log(`${logPrefix}: renaming function ${functionKey} as ${newFunctionKey}`)
            this.serverless.service.functions[newFunctionKey] = functionDefinition
            delete this.serverless.service.functions[functionKey]
        }
    }
  }

  getConfig() {
    const defaults = {notConfigured: true, enabled: false, enableTransitionSuffix: false}
    if(!this.serverless.service.custom) return defaults;

    const custom = this.serverless.service.custom
    if(custom.serverlessOfflineLambdaDocker) return {...defaults, ...custom.serverlessOfflineLambdaDocker}
    return defaults;
  }
}
 
module.exports = ServerlessOfflineLambdaDockerPlugin;
