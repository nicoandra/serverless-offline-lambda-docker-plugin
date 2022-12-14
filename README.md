# serverless-offline-lambda-docker-plugin
Use Docker images in AWS, but function handlers for Local development with Serverless Offline.

The plugin is designed to use Docker images when deploying to AWS environment; and to use the classic file-handler approach when working in the local environment.


# Instructions:

1. Install the plugin: `npm i --save serverless-offline-lambda-docker-plugin`
2. Add the plugin to the list of plugins in `serverless.yml`, *before* the `serverless-offline` plugin:

````
plugins:
 - (some plugin)
 - serverless-offline-lambda-docker-plugin
 - (another plugin)
 - serverless-offline
````

3. Configure the plugin in `custom.serverless-offline-lambda-docker-plugin` as follows:
````
custom:
  serverless-offline-lambda-docker-plugin:
    enabled: true
    dockerImage: your-docker-image:version
    localStages:
      - offline
      - dev
      - any_other_stage
     functionsToSkip:
      - some_function
      - another_function
    enableTransitionSuffix: false
````

  * enabled: allows to disable the plugin altogether.
  * dockerImage: define the image name. You can use `${env:SOME_VALUE}` in case you define the image to use through environment variables.
  * functionsToSkip: list of functions for which the plugin won't kick in. This let's you disable the plugin for specific functions if needed.
  * enableTransitionSuffix: important setting for plugin state changes (either enabling it or disabling it, see documentation below for further information)
  * localStages: list of stages the plugin will ignore.
  
4. Create a docker-handler file, that will route traffic to the actual files. Find a Python example below, and look at the `samples` folder for more languages:

docker.py
````
import importlib
import os


def find_module():
    # For this to work you need to pass the actual
    # function handler as an environment variable
    # See https://www.npmjs.com/package/serverless-offline-lambda-docker-plugin for further information
    handler_path = os.environ.get("REAL_EVT_HANDLER")
    (module_name, function_name) = handler_path.split(".")
    return (module_name.replace("/", "."), function_name)


def handler(lambda_event, lambda_context):
    (module_name, function_name) = find_module()
    loaded_module = importlib.import_module(module_name)
    event_handler = getattr(loaded_module, function_name)
    return event_handler(lambda_event, lambda_context)

````

5. Define your serverless functions as you normally do, having a `handler` key pointing to the event handler.

6. Update your Docker image following the AWS documentation, and making the docker-image to have `docker.handler` as the `CMD`:

````
CMD [ "path/to/file/docker.handler" ]

````

7. Try it with `serverless offline start --stage development` or the stage name you normally use.

** Important **
Serverless-offline requires the command to be `serverless offline start` and not `serverless offline` alone, otherwise the `offline:start:init` and `offline:start:end` lifecycle hooks won't kick in.


# How does it work?

The plugin updates the function definitions by:
1. Adding an `image` key pointing to the image you want to use
2. Copying the value of the `handler` key as a `REAL_EVT_HANDLER` environment variable of the function, which is later on used by the handler.
3. Removing the `handler` key from the function definition

# First deployment after enabling or disabling the plugin
The Lambda documentation specifies that an existing function can't change from a normal handler towards a Docker Image and vice versa. Updating the Lambda resource requires a deletion and a creation. 

This means that, in order to start using the plugin (and in order to stop using it) you will need to change the names of all functions, in such a way that the _current_ function is deleted and the _new_ function is created, with a different name.

This plugin offers an option to ease the transition towards _using the plugin_ by enabling and disabling the `enableTransitionSuffix` option.

When the `enableTransitionSuffix` option is set to `true`, the plugin will add the `Dkr` suffix to the function key in Serverless. As a result, your _previous_ function won't exist in the stack and, therefore, it will be removed from CloudFormation.

## Enabling the plugin

When using the plugin for the first time, set `enableTransitionSuffix: true` in the plugin configuration and attempt a deployment. Once the deployment is successful you can set `enableTransitionSuffix: false` and deploy again.

## Disabling the plugin
When attempting to disable the plugin, set `enableTransitionSuffix: true`, keeping the plugin enabled, and attempt to deploy. Upon success, disable the plugin and deploy again. This will revert the function to use normal handlers and will also rename the functions back as they were originally.


# To do:
* Add tests
* Include a NodeJs sample file
* Add linter
* Test with Serverless 3

# Issues, bug reports and collaboration:
* Issues can be created on the Issues section
* Pull requests are accepted

# Disclaimer:
* This plugin won't build any docker image. Building the images and pushing them to an image repository should be done manually
* This plugin wasn't tested with Serverless v3 as I'm using v2.



