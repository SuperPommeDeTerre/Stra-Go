require.config({
    "baseUrl": 'js/lib',
    "paths": {
      "app": "../app"
    },
    "shim": {
        "jquery-ui": ["jquery"],
    }
});

// Load the main app module to start the app
require(["app/main"]);