require.config({
    "baseUrl": "js/lib",
    "paths": {
      "app": "../app"
    },
    "shim": {
        "jquery-ui": ["jquery"],
        "jquery-svg": ["jquery"],
        "jquery-ui-contextmenu": ["jquery-ui"],
        "jquery-svgdom": ["jquery-svg"],
        "jquery-svgfilter": ["jquery-svg"],
        "jquery-svggraph": ["jquery-svg"],
        "jquery-svgplot": ["jquery-svg"]
    }
});

require(["jquery-svg", "jquery-svgdom", "jquery-svggraph", "jquery-svgplot", "jquery-svgfilter", "app/main"]);
// Load the main app module to start the app