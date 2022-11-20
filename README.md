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
    local-handler: path/to/local/file.handler
    docker-image: your-docker-image:version
    local-stages:
      - offline
      - dev
      - any_other_stage
     disabled-functions:
      - some_function
      - another_function
````

  * enabled: allows to disable the plugin altogether.
  * local-handler: define the path of your function handler following the same serverless convention, ie (path to file).(handler function name).
  * docker-image: define the image name. You can use `${env:SOME_VALUE}` in case you define the image to use through environment variables.
  * local-stages: list of stages for which the local-handler will be used.
  * disabled-functions: list of functions for which the plugin won't kick in. This let's you disable the plugin for specific functions if needed.
  
4. Create a docker-handler file, that will route traffic to the actual files. Find a Python example below, and feel free to submit a NodeJs example if you get it done:


docker.py
````
import importlib
import os

# Refer to https://github.com/nicoandra/serverless-offline-lambda-docker-plugin for further information

def find_module():
    # For this to work you need to pass the actual
    # function handler as an environment variable
    path = os.environ.get("REAL_EVT_HANDLER")
    (module_name, function_name) = path.split(".")[0].replace("/", ".")
    return (module_name, function_name)


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


