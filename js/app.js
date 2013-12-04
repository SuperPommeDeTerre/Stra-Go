require.config({
    "baseUrl": "js/lib",
    "paths": {
      "app": "../app"
    },
    "shim": {
        "jquery-ui": ["jquery"],
        "jquery-svg": ["jquery"],
        "colorpicker": ["jquery"],
        "jquery-svgdom": ["jquery-svg"],
        "jquery-svgfilter": ["jquery-svg"],
        "jquery-svggraph": ["jquery-svg"],
        "jquery-svgplot": ["jquery-svg"]
    }
});

// Load the main app module to start the app
require(["jquery-svg", "colorpicker", "jquery-svgdom", "jquery-svggraph", "jquery-svgplot", "jquery-svgfilter", "app/main"]);
