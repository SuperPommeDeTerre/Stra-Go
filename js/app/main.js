// Global variables to store configuration
var gGames = null,
    gModes = null,
    gMaps = null,
    gElements = null,
    gCurrentConf = {},
    gI18n = null,
    myDraggedElement = null,
    myDraggedElementWidth = 0,
    myDraggedElementHeight = 0,
    gCountElems = {};

// Constants
var gDECAL_GRID = 20,
    gCHAR_CODE_A = "A".charCodeAt(0),
    gCHAR_CODE_1 = "1".charCodeAt(0),
    gWIND_ROSE_SIZE = 100,
    gDROP_ZONE_BORDER = 30,
    gNB_COLS = 10,
    gNB_ROWS = 10,
    gIMPORT_TIMEOUT = 100;

function clickMovable(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    if (e.which === 1) {
        if (myDraggedElement === null) {
            var myRelatedElement = $("#" + $(this).attr("rel"));
            myDraggedElement = $(this).add(myRelatedElement);
            myDraggedElement.addClass("moving");
            if (myDraggedElement.is("image")) {
                myDraggedElementWidth = myDraggedElement.attr("width");
                myDraggedElementHeight = myDraggedElement.attr("height");
            } else if (myRelatedElement.is("image")) {
                myDraggedElementWidth = myRelatedElement.attr("width");
                myDraggedElementHeight = myRelatedElement.attr("height");
            }
        } else {
            myDraggedElement.removeClass("moving");
            myDraggedElement = null;
            myDraggedElementWidth = 0;
            myDraggedElementHeight = 0;
        }
    }
};

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
        $(document).on("submit", "form", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
        });
        var myCanvasContainer = $("#mapContainer"),
            myContextMenuElement = $("#contextMenuElement"),
            preventClosingContextMenu = false,
            timeoutIdContextMenuElement = 0;
        // Manage context menus
        myContextMenuElement.on("mouseenter", function(e) {
            preventClosingContextMenu = true;
            window.clearTimeout(timeoutIdContextMenuElement);
        }).on("mouseleave", function(e) {
            preventClosingContextMenu = false;
            myContextMenuElement.hide();
        });
        myContextMenuElement.find(".move").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            if (myDraggedElement === null) {
                myDraggedElement = $("#" + myContextMenuElement.attr("rel"));
                myDraggedElementWidth = myDraggedElement.attr("width");
                myDraggedElementHeight = myDraggedElement.attr("height");
                myDraggedElement = myDraggedElement.add($("#" + myDraggedElement.attr("rel")));
                myDraggedElement.addClass("moving");
            }
            myContextMenuElement.hide();
        });
        myContextMenuElement.find(".delete").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            $("#dialog-confirm").dialog({
                "resizable": false,
                "modal": true,
                "buttons": {
                    "Oui": function() {
                        var myTmpElement = $("#" + myContextMenuElement.attr("rel"));
                        myTmpElement = myTmpElement.add($("#" + myTmpElement.attr("rel")));
                        myTmpElement.remove();
                        myContextMenuElement.hide();
                        $(this).dialog("close");
                    },
                    "Non": function() {
                        $(this).dialog("close");
                    }
                }
            });
        });
        myContextMenuElement.find(".modifytext").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            // TODO: Handle text modify
            var myText = $("#" + myContextMenuElement.attr("rel"));
            myText = $("#" + myText.attr("rel"));
            $("body>form").append("<div id=\"textEdit\" title=\"Modifier le texte\"><form><input type=\"text\" value=\"" + myText.text().replace(/\"/g, "&quot;") + "\" /></form></div>");
            $("#textEdit").dialog({
                "resizable": false,
                "modal": true,
                "buttons": {
                    "Ok": function() {
                        myText.text($(this).find("input").val());
                        $(this).dialog("close");
                    },
                    "Annuler": function() {
                        $(this).dialog("close");
                    }
                }
            });
        });
        myCanvasContainer.on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            if (myDraggedElement !== null) {
                myDraggedElement.removeClass("moving");
                myDraggedElement = null;
                myDraggedElementWidth = 0;
                myDraggedElementHeight = 0;
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
                            myElem = gElements[elementType]["team" + elementTeam],
                            myCanvas = myCanvasContainer.svg().svg("get"),
                            g1 = myCanvasContainer.find("#elementsOverlay").svg(),
                            g2 = myCanvasContainer.find("#textsOverlay").svg(),
                            myElemId = "element_" + elementType + "_" + elementTeam + "_" + gCountElems[elementType]++,
                            myElemTextId = myElemId + "_text",
                            myImage = myCanvas.image(g1, e.pageX - myCanvasContainer[0].offsetLeft - (myElem.size.x / 2), e.pageY - myCanvasContainer[0].offsetTop - (myElem.size.y / 2), myElem.size.x, myElem.size.y, "./res/" + gCurrentConf.game + "/elements/" + myElem.file, { "id": myElemId, "rel": myElemTextId }),
                            myText = myCanvas.text(g2, e.pageX - myCanvasContainer[0].offsetLeft + (myElem.size.x / 2), e.pageY - myCanvasContainer[0].offsetTop + 7, selectedItem.text() + " " + gCountElems[elementType], { "id": myElemTextId, "rel": myElemId });
                        $(myImage).addClass("movable").addClass("hasMenuElement");
                        $(myText).addClass("movable").addClass("hasMenuElement");
                        $(myImage).add($(myText)).on("mouseenter", function(e) {
                            if (!$(this).hasClass("moving") && myDraggedElement === null) {
                                myContextMenuElement.css("top", ($(myImage).attr("y") * 1 + myCanvasContainer[0].offsetTop + 25) + "px")
                                    .css("left", ($(myImage).attr("x") * 1 + myCanvasContainer[0].offsetLeft + 30) + "px")
                                    .attr("rel", $(myImage).attr("id"))
                                    .show();
                                // Keep menu open for 200ms
                                preventClosingContextMenu = true;
                                timeoutIdContextMenuElement = window.setTimeout(function() {
                                    preventClosingContextMenu = false;
                                }, 200);
                            }
                        }).on("mouseleave", function(e) {
                            if (!preventClosingContextMenu) {
                                myContextMenuElement.hide();
                            }
                        });
                    }
                }
            }
        })
        // Handle movement of items
        .on("mousemove", function(e) {
            if (myDraggedElement !== null) {
                myDraggedElement.each(function(i, el) {
                    var elem = $(el);
                    if (elem.is("image")) {
                        elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft - (myDraggedElementWidth / 2));
                        elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop - (myDraggedElementHeight / 2));
                    } else if (elem.is("text")) {
                        elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft + (myDraggedElementWidth / 2));
                        elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop + 7);
                    }
                });
            }
        });
        $('#colorSelectorLine').ColorPicker({
            onSubmit: function(hsb, hex, rgb, el) {
                $(el).val(hex);
                $(el).ColorPickerHide();
            },
            onBeforeShow: function () {
                $(this).ColorPickerSetColor(this.value);
            }
        }).bind('keyup', function(){
            $(this).ColorPickerSetColor(this.value);
        });;
        // Load global configuration
        $.getJSON("./config/config.json", {}, function(data) {
            gGames = data.games;

            // Get i18n strings
            $.getJSON("./i18n/" + data.lang.default + "/i18n.json", {}, function(data) {
                gI18n = data;
                // Add contexts menus
                /* Buggy...
                myCanvasContainer.children("svg").contextMenu({
                    "selector": ".movable",
                    "callback": function(key, options) {
                        window.console && console.log(m);
                    },
                    "items": {
                        "copy": {"name": gI18n.contextmenu.element.copy, "icon": "copy"},
                        "paste": {"name": "Paste", "icon": "paste"},
                        "delete": {"name": gI18n.contextmenu.element.delete, "icon": "delete"},
                        "sep1": "---------",
                        "quit": {"name": "Quit", "icon": "quit"}
                    }
                });
                */
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
                        // Populate the maps
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
                        // Populate the elements
                        for (myElementToken in gElements) {
                            gCountElems[myElementToken] = 0;
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
                            if (!$(this).hasClass("selected")) {
                                $("#menuEdit").find(".selected").removeClass("selected")
                            }
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
                    // Remove groups and trigger events
                    $("#selMode").change();
                    $("#gridOverlay").remove();
                    $("#chkGrid").change();
                    $("#scaleOverlay").remove();
                    $("#chkScale").change();
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
                                myCanvas.line(g, i + gDECAL_GRID, gDECAL_GRID, i + gDECAL_GRID, gMaps[gCurrentConf.map].size.y + gDECAL_GRID, {"class": "outer"});
                                myCanvas.line(g, i + gDECAL_GRID, 0, i + gDECAL_GRID, gDECAL_GRID, {"class": "inner"});
                                myCanvas.line(g, gDECAL_GRID, i + gDECAL_GRID, gMaps[gCurrentConf.map].size.y + gDECAL_GRID, i + gDECAL_GRID, {"class": "outer"});
                                myCanvas.line(g, 0, i + gDECAL_GRID, gDECAL_GRID, i + gDECAL_GRID, {"class": "inner"});
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
                                        myCanvas.text(g, myMapMode[myMapTeam][i].x + gDECAL_GRID - 2, myMapMode[myMapTeam][i].y + 5 + gDECAL_GRID, (countDrops++ + 1) + "", { "class": myMapTeam });
                                    }
                                }
                            }
                        } else {
                            $("#basesOverlay").show();
                        }
                    } else {
                        $("#basesOverlay").hide();
                    }
                });
                $("#chkElements").click(function(e) {
                    if ($(this).is(":checked")) {
                        $("#elementsOverlay").show();
                    } else {
                        $("#elementsOverlay").hide();
                    }
                });
                $("#chkTexts").click(function(e) {
                    if ($(this).is(":checked")) {
                        $("#textsOverlay").show();
                    } else {
                        $("#textsOverlay").hide();
                    }
                });
                $("#chkScale").change(function(e) {
                    if ($(this).is(":checked")) {
                        if ($("#scaleOverlay").length === 0) {
                            var myCanvas = myCanvasContainer.svg().svg("get"),
                                g = myCanvas.group(null, "scaleOverlay", {}),
                                myMap = gMaps[gCurrentConf.map];
                            // Add the lines
                            myCanvas.line(g, myMap.size.x + gDECAL_GRID - 120, myMap.size.y + gDECAL_GRID - 20, myMap.size.x + gDECAL_GRID - 20, myMap.size.y + gDECAL_GRID - 20, {});
                            myCanvas.line(g, myMap.size.x + gDECAL_GRID - 120, myMap.size.y + gDECAL_GRID - 20, myMap.size.x + gDECAL_GRID - 120, myMap.size.y + gDECAL_GRID - 25, {});
                            myCanvas.line(g, myMap.size.x + gDECAL_GRID - 20, myMap.size.y + gDECAL_GRID - 20, myMap.size.x + gDECAL_GRID - 20, myMap.size.y + gDECAL_GRID - 25, {});
                            // Add the text
                            myCanvas.text(g, myMap.size.x + gDECAL_GRID - 85, myMap.size.y + gDECAL_GRID - 25, "100m", {});
                        } else {
                            $("#scaleOverlay").show();
                        }
                    } else {
                        $("#scaleOverlay").hide();
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
