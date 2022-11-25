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
