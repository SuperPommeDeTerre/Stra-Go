// Globale variables to store configuration
var gGames = null,
    gModes = null,
    gMaps = null,
    gCurrentConf = {},
    gI18n = null;

define(["jquery", "jquery-ui"], function($) {
    $(function() {
        /*
        $.support.cors = true;
        $.ajaxPrefilter("json jsonp script", function(options) {
            options.crossDomain = true;
        });
        */
        $("#menu a").click(function(e) {
            e.preventDefault();
        });
        // Load global configuration
        $.getJSON("./config/config.json", {}, function(data) {
            gGames = data.games;

            // Get i18n strings
            $.getJSON("./i18n/" + data.lang.default + "/i18n.json", {}, function(data) {
                gI18n = data;
                // Add the games to the corresponding menu
                var myGames = "",
                    myGameToken = null;
                    myGameObj = null;
                for (myGameToken in gGames) {
                    myGameObj = gGames[myGameToken];
                    myGames += "<option value=\"" + myGameToken + "\">" + myGameObj.name + "</option>";
                }
                $("#selGame").append(myGames).change(function(e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    var myGameToken = $(this).val();
                    gCurrentConf.game = myGameToken;
                    $.getJSON("./config/" + myGameToken + "/maps.json", {}, function(data) {
                        gMaps = data;
                        var myMapToken = null,
                            myMapObj = null,
                            myMaps = "";
                        for (myMapToken in gMaps) {
                            myMapObj = gMaps[myMapToken];
                            myMaps += "<option value=\"" + myMapToken + "\">" + gI18n.games[myGameToken].maps[myMapToken] + "</option>";
                        }
                        $("#selMap").html(myMaps);
                    }).fail(function() {
                        console.log("Error while getting ./config/" + myGameToken + "/maps.json");
                    });
                }).change();
                $("#selMap").change(function(e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    var myGameToken = $("#selGame").val(),
                        myMapToken = $(this).val(),
                        myMapObj = gMaps[myMapToken],
                        myMapModes = "";
                    gCurrentConf.map = myMapToken;
                    $("#mapContainer").html("<img src=\"./res/" + myGameToken + "/maps/" + myMapObj.file + "\">");
                    for (var myMode in myMapObj.modes) {
                        myMapModes += "<option value=\"" + myMapObj.modes[myMode] + "\">" + gI18n.games[myGameToken].modes[myMapObj.modes[myMode]] + "</option>";
                    }
                    $("#selMode").html(myMapModes);
                });
                $("#selMode").change(function(e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    gCurrentConf.mode = $(this).val();
                });
                updateComponents();
            }).fail(function() {
                console.log("Error while getting ./i18n/" + data.lang.default + "/i18n.json");
            });
        }).fail(function() {
            console.log("Error while getting ./config/config.json");
        });
    });
});

/**
 * This function is used to update components style and behavior after modifying the DOM.
 */
function updateComponents() {
    $("input[type=submit],input[type=reset],input[type=button],button,a.button").button();
};
