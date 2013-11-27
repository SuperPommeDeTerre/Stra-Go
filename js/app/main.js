// Global variables to store configuration
var gGames = null,
    gModes = null,
    gMaps = null,
    gElements = null,
    gCurrentConf = {},
    gI18n = null;

// Constants
var gDECAL_GRID = 20,
    gCHAR_CODE_A = "A".charCodeAt(0),
    gCHAR_CODE_1 = "1".charCodeAt(0),
    gWIND_ROSE_SIZE = 100,
    gDROP_ZONE_BORDER = 30,
    gNB_COLS = 10,
    gNB_ROWS = 10,
    gIMPORT_TIMEOUT = 100;

/**
 * Main function
 */
define(["jquery", "jquery-ui", "jquery-svg"], function($) {
    $(function() {
        /*
        $.support.cors = true;
        $.ajaxPrefilter("json jsonp script", function(options) {
            options.crossDomain = true;
        });
        $.event.props.push("dataTransfer");
        */
        $("#menu a").click(function(e) {
            e.preventDefault();
        });
        // Load global configuration
		var myDraggedElement = null;
        var myCanvasContainer = $("#mapContainer");
        myCanvasContainer.on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
			if (myDraggedElement !== null) {
				return;
			}
            var selectedItem = $("#menuEdit .selected");
            if (selectedItem.length > 0) {
                if (selectedItem.is("a")) {
                    var myItemProps = selectedItem.attr("href").split(/\//g),
                        i = 0;
                    if (myItemProps[2] === "element") {
                        var elementType = myItemProps[3],
                            elementTeam = myItemProps[4],
                            myElem = gElements[elementType]["team" + elementTeam];
                        var myCanvas = myCanvasContainer.svg().svg("get"),
                            g = myCanvasContainer.find("#elementsOverlay").svg(),
                            myImage = myCanvas.image(g, e.pageX - myCanvasContainer[0].offsetLeft - (myElem.size.x / 2), e.pageY - myCanvasContainer[0].offsetTop - (myElem.size.y / 2), myElem.size.x, myElem.size.y, "./res/" + gCurrentConf.game + "/elements/" + myElem.file, {});
                        $(myImage).on("click", function(e) {
							e.stopImmediatePropagation();
							e.preventDefault();
							if (e.which === 1) {
								if (myDraggedElement === null) {
									myDraggedElement = $(this);
									myDraggedElement.addClass("moving");
								} else {
									myDraggedElement.removeClass("moving");
									myDraggedElement = null;
								}
							}
                        });
                    }
                }
            }
        })
		// Handle movement of items
		.on("mousemove", function(e) {
			if (myDraggedElement !== null) {
				myDraggedElement.attr("x", e.pageX - myCanvasContainer[0].offsetLeft - (myDraggedElement.attr("width") / 2));
				myDraggedElement.attr("y", e.pageY - myCanvasContainer[0].offsetTop - (myDraggedElement.attr("height") / 2));
			}
        });
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
                    $.getJSON("./res/" + myGameToken + "/game.json", {}, function(data) {
                        gMaps = data.maps;
                        gElements = data.elements;
                        var myMapToken = null,
                            myMapObj = null,
                            myMaps = "",
                            myElementToken = null,
                            myElements0 = "";
                            myElements1 = "";
                            myElements2 = "";
                        for (myMapToken in gMaps) {
                            myMapObj = gMaps[myMapToken];
                            myMaps += "<option value=\"" + myMapToken + "\">" + gI18n.games[myGameToken].maps[myMapToken] + "</option>";
                        }
                        $("#selMap").html(myMaps);
                        $("#selMap").html($("option", $("#selMap")).sort(function(a, b) { 
                            return $(a).text().localeCompare($(b).text());
                        }));
                        for (myMapToken in gMaps) {
                            $("#selMap").val(myMapToken);
                            break;
                        }
                        $("#selMap").change();
                        // Build the html for the elements
                        for (myElementToken in gElements) {
                            if (gElements[myElementToken].team0) {
                                myElements0 += "<li><a href=\"edit/add/element/" + myElementToken + "/0\" class=\"element " + myElementToken + "0\" title=\"" + gI18n.games[myGameToken].elements[myElementToken] + "\"><span>" + gI18n.games[myGameToken].elements[myElementToken] + "</span></a></li>";
                            }
                            if (gElements[myElementToken].team1) {
                                myElements1 += "<li><a href=\"edit/add/element/" + myElementToken + "/1\" class=\"element " + myElementToken + "1\" title=\"" + gI18n.games[myGameToken].elements[myElementToken] + "\"><span>" + gI18n.games[myGameToken].elements[myElementToken] + "</span></a></li>";
                            }
                            if (gElements[myElementToken].team2) {
                                myElements2 += "<li><a href=\"edit/add/element/" + myElementToken + "/2\" class=\"element " + myElementToken + "2\" title=\"" + gI18n.games[myGameToken].elements[myElementToken] + "\"><span>" + gI18n.games[myGameToken].elements[myElementToken] + "</span></a></li>";
                            }
                        }
                        // Clear old elements and add the new ones
                        $("#elements").find("legend").siblings().remove();
                        $("#elements").append("<section class=\"flex flex-h\"><aside class=\"flex-start\"><ul class=\"elements\">" + myElements0 + "</ul></aside><aside class=\"flex-fluid\"><ul class=\"elements\">" + myElements1 + "</ul></aside><aside class=\"flex-end\"><ul class=\"elements\">" + myElements2 + "</ul></aside></section>");
                        $("#menuEdit").find(".element").click(function(e) {
                            e.stopImmediatePropagation();
                            e.preventDefault();
                            $("#menuEdit").find(".selected").removeClass("selected")
                            $(this).toggleClass("selected");
                        });
                    }).fail(function() {
                        console.log("Error while getting ./res/" + myGameToken + "/game.json");
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

                    // Set the map image and resize it to its real size (1px = 1m)
                    myCanvasContainer.css("background-image", "url('./res/" + myGameToken + "/maps/" + myMapObj.file + "')")
                        .css("background-position", gDECAL_GRID + "px " + gDECAL_GRID + "px")
                        .css("background-size", myMapObj.size.x + "px " + myMapObj.size.y + "px")
                        .css("background-repeat", "no-repeat")
                        .width(myMapObj.size.x + gDECAL_GRID + "px")
                        .height(myMapObj.size.y + gDECAL_GRID + "px");
                    for (var myMode in myMapObj.modes) {
                        myMapModes += "<option value=\"" + myMode + "\">" + gI18n.games[myGameToken].modes[myMode] + "</option>";
                    }
                    $("#selMode").html(myMapModes).change();
                    $("#selMode").html($("option", $("#selMode")).sort(function(a, b) { 
                        return $(a).text().localeCompare($(b).text());
                    }));
                    for (myMode in myMapObj.modes) {
                        $("#selMode").val(myMode);
                        break;
                    }
                    $("#selMode").change();
                    $("#gridOverlay").remove();
                    $("#chkGrid").change();
                    $("#windRoseOverlay").remove();
                    $("#elementsOverlay").remove();
                    $("#linesOverlay").remove();
                    $("#shapesOverlay").remove();
                    $("#zonesOverlay").remove();
                    $("#textsOverlay").remove();
                    $("#chkDirections").change();
                    $("#mapDesc .mapName").text(gI18n.games[myGameToken].maps[myMapToken]);
                    $("#mapDesc .mapMetrics").text(myMapObj.size.x + "m x " + myMapObj.size.y + "m");
                    $("#mapDesc .mapSquareLength").text("(1px = 1m)");
                    $("#txtImportExport").val(JSON.stringify(gCurrentConf));
                    var myCanvas = myCanvasContainer.svg().svg("get");
                    myCanvas.group(null, "elementsOverlay", {});
                    myCanvas.group(null, "linesOverlay", {});
                    myCanvas.group(null, "shapesOverlay", {});
                    myCanvas.group(null, "zonesOverlay", {});
                    myCanvas.group(null, "textsOverlay", {});
                });
                $("#selMode").change(function(e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    gCurrentConf.mode = $(this).val();
                    $("#basesOverlay").remove();
                    $("#chkBases").change();
                    $("#txtImportExport").val(JSON.stringify(gCurrentConf));
                });
                $("#chkGrid").change(function(e) {
                    var i = 0;
                        j = 0;
                    if ($(this).is(":checked")) {
                        if ($("#gridOverlay").length === 0) {
                            var myCanvas = myCanvasContainer.svg().svg("get"),
                                g = myCanvas.group(null, "gridOverlay", {});
                            for (i=0; i<gMaps[gCurrentConf.map].size.x; i+=gMaps[gCurrentConf.map].size.x/gNB_COLS) {
                                // Last column is 0
                                if (j < gNB_COLS - 1) {
                                    myCanvas.text(g, i + gDECAL_GRID + gMaps[gCurrentConf.map].size.x/(gNB_COLS * 2), 16, String.fromCharCode(gCHAR_CODE_1 + j));
                                } else {
                                    myCanvas.text(g, i + gDECAL_GRID + gMaps[gCurrentConf.map].size.x/(gNB_COLS * 2), 16, "0");
                                }
                                // Skip the I row
                                if (j < 8) {
                                    myCanvas.text(g, 8, i + gDECAL_GRID + gMaps[gCurrentConf.map].size.x/(gNB_ROWS * 2), String.fromCharCode(gCHAR_CODE_A + j));
                                } else {
                                    myCanvas.text(g, 8, i + gDECAL_GRID + gMaps[gCurrentConf.map].size.x/(gNB_ROWS * 2), String.fromCharCode(gCHAR_CODE_A + j + 1));
                                }
                                j++;
                                // Don't draw the first lines as they are in the border
                                if (i === 0) {
                                    continue;
                                }
                                myCanvas.line(g, i + gDECAL_GRID, gDECAL_GRID, i + gDECAL_GRID, gMaps[gCurrentConf.map].size.y + gDECAL_GRID, {"stroke": "#FFF", "stroke-width": 0.5, "stroke-dasharray": "1,1"});
                                myCanvas.line(g, i + gDECAL_GRID, 0, i + gDECAL_GRID, gDECAL_GRID, {"stroke": "#000", "stroke-width": 0.5, "stroke-dasharray": "1,1"});
                                myCanvas.line(g, gDECAL_GRID, i + gDECAL_GRID, gMaps[gCurrentConf.map].size.y + gDECAL_GRID, i + gDECAL_GRID, {"stroke": "#FFF", "stroke-width": 0.5, "stroke-dasharray": "1,1"});
                                myCanvas.line(g, 0, i + gDECAL_GRID, gDECAL_GRID, i + gDECAL_GRID, {"stroke": "#000", "stroke-width": 0.5, "stroke-dasharray": "1,1"});
                            }
                        } else {
                            $("#gridOverlay").show();
                        }
                    } else {
                        $("#gridOverlay").hide();
                    }
                });
                $("#chkDirections").change(function(e) {
                    if ($(this).is(":checked")) {
                        if ($("#windRoseOverlay").length === 0) {
                            var myCanvas = myCanvasContainer.svg().svg("get"),
                                g = myCanvas.group(null, "windRoseOverlay", {});
                            myCanvas.image(g, gMaps[gCurrentConf.map].size.x - gWIND_ROSE_SIZE + gDECAL_GRID, gDECAL_GRID, gWIND_ROSE_SIZE, gWIND_ROSE_SIZE, "./res/images/windrose.png", {});
                        } else {
                            $("#windRoseOverlay").show();
                        }
                    } else {
                        $("#windRoseOverlay").hide();
                    }
                });
                $("#chkBases").change(function(e) {
                    if ($(this).is(":checked")) {
                        if ($("#basesOverlay").length === 0) {
                            var myCanvas = myCanvasContainer.svg().svg("get"),
                                g = myCanvas.group(null, "basesOverlay", {}),
                                myMapMode = gMaps[gCurrentConf.map].modes[gCurrentConf.mode],
                                countDrops = 0;
                            for (var myMapTeam in myMapMode) {
                                countDrops = 0;
                                for (var i in myMapMode[myMapTeam]) {
                                    if (myMapMode[myMapTeam][i].type === "base") {
                                        // It's the main bases, they are round
                                        myCanvas.circle(g, myMapMode[myMapTeam][i].x + gDECAL_GRID, myMapMode[myMapTeam][i].y + gDECAL_GRID, 40, { "class": myMapTeam });
                                    } else if (myMapMode[myMapTeam][i].type === "drop") {
                                        // It's the drop points, they are square
                                        myCanvas.polygon(g, [[myMapMode[myMapTeam][i].x - gDROP_ZONE_BORDER + gDECAL_GRID, myMapMode[myMapTeam][i].y + gDECAL_GRID],
                                                             [myMapMode[myMapTeam][i].x + gDECAL_GRID, myMapMode[myMapTeam][i].y - gDROP_ZONE_BORDER + gDECAL_GRID],
                                                             [myMapMode[myMapTeam][i].x + gDROP_ZONE_BORDER + gDECAL_GRID, myMapMode[myMapTeam][i].y + gDECAL_GRID],
                                                             [myMapMode[myMapTeam][i].x + gDECAL_GRID, myMapMode[myMapTeam][i].y + gDROP_ZONE_BORDER + gDECAL_GRID]], { "class": myMapTeam });
                                        myCanvas.text(g, myMapMode[myMapTeam][i].x + gDECAL_GRID, myMapMode[myMapTeam][i].y + 5 + gDECAL_GRID, (countDrops++ + 1) + "", { "class": myMapTeam });
                                    }
                                }
                            }
                            $("#basesOverlay").find("circle").draggable()
                            .bind('mousedown', function(event, ui){
                                // bring target to front
                                $(event.target.parentElement).append(event.target);
                            })
                            .bind('drag', function(event, ui){
                                // update coordinates manually, since top/left style props don't work on SVG
                                event.target.setAttribute('x', ui.position.left);
                                event.target.setAttribute('y', ui.position.top);
                            });
                        } else {
                            $("#basesOverlay").show();
                        }
                    } else {
                        $("#basesOverlay").hide();
                    }
                });
                $("#btnImport").click(function(e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    var myConf = $.parseJSON($("#txtImportExport").val());
                    $("#selGame").val(myConf.game).change();
                    window.setTimeout(function() {
                        $("#selMap").val(myConf.map).change();
                        window.setTimeout(function() {
                            $("#selMode").val(myConf.mode).change();
                            gCurrentConf = myConf;
                        }, gIMPORT_TIMEOUT);
                    }, gIMPORT_TIMEOUT);
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
