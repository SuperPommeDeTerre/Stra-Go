// Global variables to store configuration
var gGames = null,
    gModes = null,
    gMaps = null,
    gElements = null,
    gCurrentConf = {},
    gI18n = null,
    myResizedElement = null,
    myRotatedElement = null,
    myDraggedElement = null,
    myDraggedElementWidth = 0,
    myDraggedElementHeight = 0,
    gCountElems = {},
    gCountTexts = 0,
    gCurrentElement = null,
    gIsImporting = false;

// Constants
var gDECAL_GRID = 20,
    gCHAR_CODE_A = "A".charCodeAt(0),
    gCHAR_CODE_1 = "1".charCodeAt(0),
    gWIND_ROSE_SIZE = 100,
    gDROP_ZONE_BORDER = 30,
    gNB_COLS = 10,
    gNB_ROWS = 10,
    gIMPORT_TIMEOUT = 100,
    gRECT_MIN_WIDTH = 10,
    gRECT_MIN_HEIGHT = 10;

/**
 * Main function
 */
define(["jquery", "jquery-ui", "jquery-svg"], function($) {
    $(document).ready(function() {
        /*
        // Chrome specific
        $.support.cors = true;
        $.ajaxPrefilter("json jsonp script", function(options) {
            options.crossDomain = true;
        });
        // Handle HTML5 drag&drop
        $.event.props.push("dataTransfer");
        */
        $("#menuAbout > div").html("<p>" + $("header > h1").html() + "</p>");
        var myCanvasContainer = $("#mapContainer"),
            myContextMenus = $(".contextMenu"),
            myContextMenuElement = $("#contextMenuElement"),
            myContextMenuText = $("#contextMenuText"),
            myContextMenuShape = $("#contextMenuShape"),
            myShapeHandlers = $("#shapeHandlers"),
            myShapeOptions = $("#shapeOptions"),
            myShapeOptionsHandler = $("#shapeoptionshandler"),
            preventClosingContextMenu = false,
            timeoutIdContextMenu = 0;

        /**
         * Inityialization of the SVG Canvas
         * Here lies the definitions of the patterns.
         */
        function initSvg() {
            var myCanvas = myCanvasContainer.svg().svg("get"),
                myDefs = myCanvas.defs(),
                myPattern = myCanvas.pattern(myDefs, "patternZebra", 0, 0, 20, 20, {"patternUnits": "userSpaceOnUse"});
            // Diagonal stroke pattern
            myCanvas.polygon(myPattern, [[0, 0], [0, 5], [5, 0]], {});
            myCanvas.polygon(myPattern, [[20, 20], [15, 20], [20, 15]], {});
            myCanvas.polygon(myPattern, [[15, 0], [20, 0], [20, 5], [5, 20], [0, 20], [0, 15]], {});
            myPattern = myCanvas.pattern(myDefs, "patternChess", 0, 0, 20, 20, {"patternUnits": "userSpaceOnUse"});
            myCanvas.polygon(myPattern, [[0, 0], [0, 10], [10, 10], [10, 0]], {});
            myCanvas.polygon(myPattern, [[10, 10], [10, 20], [20, 20], [20, 10]], {});
            myPattern = myCanvas.pattern(myDefs, "patternTriangle", 0, 0, 10, 10, {"patternUnits": "userSpaceOnUse"});
            myCanvas.polygon(myPattern, [[5, 0], [10, 10], [0, 10]], {});
        };

        /**
         * Sets the position of a shape
         *
         * @param pShape
         *     The jQuery object of a shape
         * @param pPos
         *     The position to set
         * @return The shape
         */
        function setShapePos(pShape, pPos) {
            var myTransform = pShape.attr("transform");
            if (myTransform) {
                pShape.attr("transform", "translate(" + pPos.x + " " + pPos.y + ")" + myTransform.substr(myTransform.indexOf(")") + 1));
            } else if (pShape.is("rect")) {
                pShape.attr("x", pPos.x).attr("y", pPos.y);
            } else if (pShape.is("ellipse")) {
                pShape.attr("cx", pPos.x).attr("cy", pPos.y);
            }
            pShape.data("x", pPos.x).data("y", pPos.y);
            return pShape;
        };

        /**
         * Gets the position of a shape
         * 
         * @return { x, y }
         */
        function getShapePos(pShape) {
            var myTransform = pShape.attr("transform");
            if (myTransform) {
                var myIndexTranslate = myTransform.indexOf("translate(");
                if (myIndexTranslate >= 0) {
                    myTransform = myTransform.substr(myTransform.indexOf("translate(") + 10);
                    myTransform = myTransform.substr(0, myTransform.indexOf(")"));
                    var myDims = myTransform.split(/ /g);
                    return {
                        "x": myDims[0] * 1,
                        "y": myDims[1] * 1
                    }
                }
            }
            if (pShape.is("rect")) {
                return {
                    "x": pShape.attr("x") * 1,
                    "y": pShape.attr("y") * 1
                }
            } else if (pShape.is("ellipse")) {
                return {
                    "x": pShape.attr("cx") * 1,
                    "y": pShape.attr("cy") * 1
                }
            }
        };

        function addElement(pConfElement) {
            var myElem = gElements[pConfElement.type]["team" + pConfElement.team],
                myCanvas = myCanvasContainer.svg().svg("get"),
                g1 = myCanvasContainer.find("#elementsOverlay").svg(),
                g2 = myCanvasContainer.find("#textsOverlay").svg(),
                myElemId = "element_" + pConfElement.type + "_" + pConfElement.team + "_" + gCountElems[pConfElement.type]++,
                myElemTextId = myElemId + "_text",
                myImage = myCanvas.image(g1, pConfElement.position.x, pConfElement.position.y, myElem.size.x, myElem.size.y, "./res/" + gCurrentConf.game + "/elements/" + myElem.file, { "id": myElemId, "rel": myElemTextId }),
                myText = myCanvas.text(g2, pConfElement.text.position.x, pConfElement.text.position.y, pConfElement.text.value, { "id": myElemTextId, "rel": myElemId });
            myImage = $(myImage);
            myText = $(myText);
            myImage.addClass("movable hasMenuElement");
            myText.addClass("movable hasMenuElement " + pConfElement.text.position.rel);
            myImage.add(myText).on("mouseenter", function(e) {
                if (!$(this).hasClass("moving") && myDraggedElement === null) {
                    myContextMenuElement.css("top", ((myImage.attr("y") * 1) + myCanvasContainer[0].offsetTop + 15) + "px")
                        .css("left", ((myImage.attr("x") * 1) + myCanvasContainer[0].offsetLeft + 20) + "px")
                        .attr("rel", myImage.attr("id"));
                    // Udpate context menu with element state
                    var myLinksTextPosition = myContextMenuElement.find(".textPosition").removeClass("selected");
                    // FIXME: Fix weird bug: myLinksTextPosition.find(".textPosition.top") is not working...
                    if (myText.hasClass("top")) {
                        $(myLinksTextPosition[0]).addClass("selected");
                        pConfElement.text.position.rel = "top";
                    } else if (myText.hasClass("right")) {
                        $(myLinksTextPosition[1]).addClass("selected");
                        pConfElement.text.position.rel = "right";
                    } else if (myText.hasClass("bottom")) {
                        $(myLinksTextPosition[2]).addClass("selected");
                        pConfElement.text.position.rel = "bottom";
                    } else {
                        $(myLinksTextPosition[3]).addClass("selected");
                        pConfElement.text.position.rel = "left";
                    }
                    gCurrentElement = pConfElement;
                    myContextMenuElement.show();
                    // Keep menu open for 200ms
                    preventClosingContextMenu = true;
                    timeoutIdContextMenu = window.setTimeout(function() {
                        preventClosingContextMenu = false;
                    }, 200);
                }
            }).on("mouseleave", function(e) {
                if (!preventClosingContextMenu) {
                    myContextMenuElement.hide();
                }
            });
            // Update serialization
            if (!gIsImporting) {
                gCurrentConf.elements.push(pConfElement);
            }
            myImage.data("index",  gCurrentConf.elements.length - 1);
        };

        function addText(pConfText) {
            var myCanvas = myCanvasContainer.svg().svg("get"),
                g = myCanvasContainer.find("#textsOverlay").svg(),
                myElemTextId = "text_" + gCountTexts++,
                myText = myCanvas.text(g, pConfText.position.x, pConfText.position.y, pConfText.value, { "id": myElemTextId });
            myText = $(myText);
            myText.on("mouseenter", function(e) {
                if (!$(this).hasClass("moving") && myDraggedElement === null) {
                    myContextMenuText.css("top", ((myText.attr("y") * 1) + myCanvasContainer[0].offsetTop) + "px")
                        .css("left", ((myText.attr("x") * 1) + myCanvasContainer[0].offsetLeft) + "px")
                        .attr("rel", myText.attr("id"));
                    gCurrentElement = pConfText;
                    myContextMenuText.show();
                    // Keep menu open for 200ms
                    preventClosingContextMenu = true;
                    timeoutIdContextMenu = window.setTimeout(function() {
                        preventClosingContextMenu = false;
                    }, 200);
                }
            }).on("mouseleave", function(e) {
                if (!preventClosingContextMenu) {
                    myContextMenuText.hide();
                }
            });
            // Update serialization
            if (!gIsImporting) {
                gCurrentConf.texts.push(pConfText);
            }
            myText.data("index",  gCurrentConf.texts.length - 1);
        };

        function addShape(pConfShape) {
            var myCanvas = myCanvasContainer.svg().svg("get"),
                g = myCanvasContainer.find("#shapesOverlay").svg(),
                myElemId = "shape_" + gCountTexts++,
                myShape = null,
                myShapeHandles = null;
            switch (pConfShape.type) {
                case "ellipse":
                    myShape = myCanvas.ellipse(g, pConfShape.position.x, pConfShape.position.y, pConfShape.rx, pConfShape.ry, { "id": myElemId });
                    break;
                case "polygon":
                    myShape = myCanvas.rect(g, pConfShape.position.x, pConfShape.position.y, 50, 50, $("#cornerRadiusSize").val() * 1, $("#cornerRadiusSize").val() * 1, { "id": myElemId });
                    break;
                case "rect":
                default:
                    myShape = myCanvas.rect(g, pConfShape.position.x, pConfShape.position.y, pConfShape.width, pConfShape.height, pConfShape.rx, pConfShape.ry, { "id": myElemId });
                    break;
            }
            myShape = $(myShape);
            myShape.data("x", pConfShape.position.x);
            myShape.data("y", pConfShape.position.y);
            for (myStyle in pConfShape.style) {
                myShape.css(myStyle, pConfShape.style[myStyle]);
            }
            switch (pConfShape.type) {
                case "polygon":
                    break;
                case "ellipse":
                    myShape.on("mouseenter", function(e) {
                        if (!$(this).hasClass("moving") && myDraggedElement === null && !$(this).hasClass("resizing") && myResizedElement === null && !$(this).hasClass("rotating") && myRotatedElement === null) {
                            var myShapePositionX = myShape.data("x"),
                                myShapePositionY = myShape.data("y"),
                                myShapeRadiusX = myShape.attr("rx") * 1,
                                myShapeRadiusY = myShape.attr("ry") * 1;
                            myShapeOptionsHandler.css("top", (myShapePositionY + myCanvasContainer[0].offsetTop - 8) + "px")
                                .css("left", (myShapePositionX + myCanvasContainer[0].offsetLeft - 8) + "px")
                                .on("mouseenter", function(e) {
                                    myContextMenuShape.css("top", (myShapePositionY + myCanvasContainer[0].offsetTop - 8) + "px")
                                        .css("left", (myShapePositionX + myCanvasContainer[0].offsetLeft - 8) + "px")
                                        .attr("rel", myShape.attr("id"));
                                    $(this).hide();
                                    myContextMenuShape.show();
                                    // Keep menu open for 200ms
                                    preventClosingContextMenu = true;
                                    timeoutIdContextMenu = window.setTimeout(function() {
                                        preventClosingContextMenu = false;
                                    }, 200);
                                }).show();
                            myShapeOptionsHandler.parent().attr("rel", myShape.attr("id"));
                            gCurrentElement = pConfShape;
                            myShapeHandlers.show();
                        }
                    });
                    break;
                    break;
                case "rect":
                default:
                    myShape.on("mouseenter", function(e) {
                        if (!$(this).hasClass("moving") && myDraggedElement === null && !$(this).hasClass("resizing") && myResizedElement === null && !$(this).hasClass("rotating") && myRotatedElement === null) {
                            var myShapePositionX = myShape.data("x"),
                                myShapePositionY = myShape.data("y"),
                                myShapeWidth = myShape.attr("width") * 1,
                                myShapeHeight = myShape.attr("height") * 1;
                            myShapeOptionsHandler.css("top", (myShapePositionY + myCanvasContainer[0].offsetTop + (myShapeHeight / 2) - 8) + "px")
                                .css("left", (myShapePositionX + myCanvasContainer[0].offsetLeft + (myShapeWidth / 2) - 8) + "px")
                                .on("mouseenter", function(e) {
                                    myContextMenuShape.css("top", (myShapePositionY + myCanvasContainer[0].offsetTop + (myShapeHeight / 2) - 8) + "px")
                                        .css("left", (myShapePositionX + myCanvasContainer[0].offsetLeft + (myShapeWidth / 2) - 8) + "px")
                                        .attr("rel", myShape.attr("id"));
                                    $(this).hide();
                                    myContextMenuShape.show();
                                    // Keep menu open for 200ms
                                    preventClosingContextMenu = true;
                                    timeoutIdContextMenu = window.setTimeout(function() {
                                        preventClosingContextMenu = false;
                                    }, 200);
                                }).show();
                            myShapeOptionsHandler.parent().attr("rel", myShape.attr("id"));
                            gCurrentElement = pConfShape;
                            myShapeHandlers.show();
                        }
                    });
                    break;
            }
            myShape.on("mouseleave", function(e) {
                if (!preventClosingContextMenu) {
                    myContextMenuShape.hide();
                }
            });
            // Update serialization
            if (!gIsImporting) {
                gCurrentConf.shapes.push(pConfShape);
            }
            myShape.data("index",  gCurrentConf.shapes.length - 1);
        };

        initSvg();
        myShapeOptionsHandler.find().on("mouseleave", function() {
            $(this).hide();
        });
        // Handle resize of shapes
        myContextMenuShape.find(".resize").on("click", function(e) {
            myResizedElement = $("#" + myContextMenuShape.attr("rel")).addClass("resizing");
            myResizedElement.data("originalposx", myResizedElement.data("x"));
            myResizedElement.data("originalposy", myResizedElement.data("y"));
        });
        // Handle rotation of shapes
        myContextMenuShape.find(".rotate").on("click", function(e) {
            myRotatedElement = $("#" + myContextMenuShape.attr("rel")).addClass("rotating");
        });
        $("#menu a").click(function(e) {
            e.preventDefault();
        });
        $("#menuEditElements > a,#menuEditTexts > a,#menuEditLines > a,#menuEditShapes > a").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            var myLink = $(this),
                isAlreadySelected = myLink.hasClass("selected"),
                myLinks = $("#menu a.selected").removeClass("selected");
            if (!isAlreadySelected) {
                myLink.addClass("selected");
                if (myLink.attr("rel")) {
                    myLink.next().find("[rel=" + myLink.attr("rel") + "]").addClass("selected");
                }
            }
        });
        $("#menuEditElements > a").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            var myLink = $(this),
                mySelectedElement = myLink.next().find(".selected").removeClass("selected");
            myLink.removeClass("selected " + mySelectedElement.attr("rel")).removeAttr("rel");
        });
        $("#menuShare").on("mouseenter", function(e) {
            $("#txtImportExport").val(btoa(unescape(encodeURIComponent(JSON.stringify(gCurrentConf)))));
        });
        $("#menuEditTexts > a").on("click", function(e) {
            e.preventDefault();
        });
        $("#menuEditShapes").find(".shape").click(function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            $("#menuEditShapes > a").attr("class", "");
            if (!$(this).hasClass("selected")) {
                $("#menu .selected").removeClass("selected");
                $("#menuEditShapes > a").addClass($(this).attr("rel") + " selected").attr("rel", $(this).attr("rel"));
            } else {
                $("#menuEditShapes > a").removeAttr("rel");
            }
            $(this).toggleClass("selected");
        });
        myContextMenuText.find(".smallertext").on("click", function(e) {
            var myText = $("#" + myContextMenuText.attr("rel")),
                myFontSize = myText.css("font-size");
            if (myFontSize) {
                myFontSize = myFontSize.split(/px/g)[0] * 1;
            } else {
                myFontSize = 16;
            }
            myText.css("font-size", (myFontSize - 2) + "px");
        });
        myContextMenuText.find(".biggertext").on("click", function(e) {
            var myText = $("#" + myContextMenuText.attr("rel")),
                myFontSize = myText.css("font-size");
            if (myFontSize) {
                myFontSize = myFontSize.split(/px/g)[0] * 1;
            } else {
                myFontSize = 16;
            }
            myText.css("font-size", (myFontSize + 2) + "px");
        });
        myContextMenuShape.find(".options").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            var myShape = $("#" + myContextMenuShape.attr("rel"));
            myShapeOptions.find("p").show().filter(function(index) {
                return !$(this).hasClass(myShape.prop("nodeName").toLowerCase());
            }).hide();
            // Handle init of shape form with shape properties
            if (gCurrentElement.style["stroke"]) {
                $("#colorSelectorShapeContour").val(gCurrentElement.style["stroke"].substr(gCurrentElement.style["stroke"].lastIndexOf("#") + 1));
            } else {
                $("#colorSelectorShapeContour").val("FFFFFF");
            }
            if (gCurrentElement.style["stroke-width"]) {
                $("#shapeContourThickness").val(gCurrentElement.style["stroke-width"].substring(0, gCurrentElement.style["stroke-width"].indexOf("px")));
            } else {
                $("#shapeContourThickness").val("1");
            }
            if (gCurrentElement.style["stroke-dasharray"]) {
                $("#shapeContourType").val(gCurrentElement.style["stroke-dasharray"].split(/,/g)[0] * 1 > $("#colorSelectorShapeContour").val() * 1?"dashed":"dotted");
            } else {
                $("#shapeContourType").val("solid");
            }
            if (gCurrentElement["rx"]) {
                $("#shapeContourRadius").val(gCurrentElement["rx"]);
            } else {
                $("#shapeContourRadius").val("0");
            }
            if (gCurrentElement.style["fill"]) {
                $("#colorSelectorShapeFill").val(gCurrentElement.style["fill"].substr(gCurrentElement.style["fill"].lastIndexOf("#") + 1));
                if (gCurrentElement.style["fill"].lastIndexOf("url(") >= 0) {
                    var myPatternName = gCurrentElement.style["fill"].substring(gCurrentElement.style["fill"].indexOf("#") + 1);
                    myPatternName = myPatternName.substring(0, myPatternName.indexOf(")"));
                    $("#shapeFillType").val(myPatternName);
                } else {
                    $("#shapeFillType").val("none");
                }
            } else {
                $("#colorSelectorShapeFill").val("333333");
                $("#shapeFillType").val("none");
            }
            if (gCurrentElement.style["fill-opacity"]) {
                $("#shapeFillOpacity").val(gCurrentElement.style["fill-opacity"]);
            } else {
                $("#shapeFillOpacity").val(".5");
            }
            // Show dialog
            myShapeOptions.dialog({
                "resizable": false,
                "modal": true,
                "buttons": [
                    {
                        "text": gI18n.buttons.ok,
                        "click": function() {
                            var myFillPattern = $("#shapeFillType").val(),
                                myFillColor = $("#colorSelectorShapeFill").val(),
                                myFillOpacity = $("#shapeFillOpacity").val(),
                                myStrokeWidth = $("#shapeContourThickness").val(),
                                myStrokeColor = $("#colorSelectorShapeContour").val();
                                myStrokeRadius = $("#shapeContourRadius").val(),
                                myStrokeType = $("#shapeContourType").val();
                            gCurrentElement.style["fill-opacity"] = myFillOpacity;
                            // FIXME: Apply a fill color with a pattern
                            if (myFillPattern !== "none") {
                                gCurrentElement.style["fill"] = "url(#" + myFillPattern + ") #" + myFillColor;
                            } else {
                                gCurrentElement.style["fill"] = "#" + myFillColor;
                            }
                            gCurrentElement.style["stroke-width"] = myStrokeWidth + "px";
                            gCurrentElement.style["stroke"] = "#" + myStrokeColor;
                            if (myShape.is("rect")) {
                                gCurrentElement.rx = myStrokeRadius;
                                gCurrentElement.ry = myStrokeRadius;
                                myShape.attr("rx", gCurrentElement.rx);
                                myShape.attr("ry", gCurrentElement.ry);
                            }
                            switch (myStrokeType) {
                                case "dashed":
                                    gCurrentElement.style["stroke-dasharray"] = (myStrokeWidth * 3) + "," + (myStrokeWidth * 3);
                                    break;
                                case "dotted":
                                    gCurrentElement.style["stroke-dasharray"] = myStrokeWidth + "," + myStrokeWidth;
                                    break;
                                case "solid":
                                default:
                                    gCurrentElement.style["stroke-dasharray"] = "";
                                    break;
                            }
                            myShape.css("fill", gCurrentElement.style["fill"]);
                            myShape.css("fill-opacity", gCurrentElement.style["fill-opacity"]);
                            myShape.css("stroke-width", gCurrentElement.style["stroke-width"]);
                            myShape.css("stroke", gCurrentElement.style["stroke"]);
                            myShape.css("stroke-dasharray", gCurrentElement.style["stroke-dasharray"]);
                            $(this).dialog("close");
                        }
                    },
                    {
                        "text": gI18n.buttons.cancel,
                        "click": function() {
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        });
        $("#inverseTeams").on("change", function(e) {
            var elemsTeam1 = myCanvasContainer.find(".team1"),
                elemsTeam2 = myCanvasContainer.find(".team2");
            elemsTeam1.removeClass("team1").addClass("team2");
            elemsTeam2.removeClass("team2").addClass("team1");
        });
        $(document).on("submit", "form", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
        });
        // Manage context menus
        myContextMenus.on("mouseenter", function(e) {
            preventClosingContextMenu = true;
            window.clearTimeout(timeoutIdContextMenu);
        }).on("mouseleave", function(e) {
            preventClosingContextMenu = false;
            myContextMenus.hide();
        });
        myContextMenus.find(".move").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            var myContextMenu = $(this).closest(".contextMenu");
            if (myDraggedElement === null) {
                myDraggedElement = $("#" + myContextMenu.attr("rel"));
                myDraggedElementWidth = myDraggedElement.attr("width");
                myDraggedElementHeight = myDraggedElement.attr("height");
                myDraggedElement = myDraggedElement.add($("#" + myDraggedElement.attr("rel")));
                myDraggedElement.addClass("moving");
                myContextMenu.hide();
            }
        });
        myContextMenus.find(".delete").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            var myContextMenu = $(this).closest(".contextMenu");
            $("#dialog-confirm").dialog({
                "resizable": false,
                "modal": true,
                "buttons": [
                    {
                        "text": gI18n.buttons.yes,
                        "click": function() {
                            if (myContextMenu.is("#contextMenuElement")) {
                                var myTmpElement = $("#" + myContextMenu.attr("rel")),
                                    myElementIndex = myTmpElement.data("index");
                                myTmpElement = myTmpElement.add($("#" + myTmpElement.attr("rel")));
                                myTmpElement.remove();
                                // Remove object from global configuration
                                gCurrentConf.elements.splice(myElementIndex, 1);
                                $("#elementsOverlay image").each(function(i, el) {
                                    if ($(el).data("index") > myElementIndex) {
                                        $(el).data("index", $(el).data("index") - 1);
                                    }
                                });
                            } else if (myContextMenu.is("#contextMenuText")) {
                                var myTmpElement = $("#" + myContextMenu.attr("rel")),
                                    myElementIndex = myTmpElement.data("index");
                                myTmpElement.remove();
                                // Remove object from global configuration
                                gCurrentConf.texts.splice(myElementIndex, 1);
                                $("#textsOverlay text:not([rel])").each(function(i, el) {
                                    if ($(el).data("index") > myElementIndex) {
                                        $(el).data("index", $(el).data("index") - 1);
                                    }
                                });
                            } else if (myContextMenu.is("#contextMenuShape")) {
                                var myTmpElement = $("#" + myContextMenu.attr("rel")),
                                    myElementIndex = myTmpElement.data("index");
                                myTmpElement.remove();
                                // Remove object from global configuration
                                gCurrentConf.shapes.splice(myElementIndex, 1);
                                $("#shapesOverlay *:not([rel])").each(function(i, el) {
                                    if ($(el).data("index") > myElementIndex) {
                                        $(el).data("index", $(el).data("index") - 1);
                                    }
                                });
                            } else if (myContextMenu.is("#contextMenuLine")) {
                                // TODO
                            }
                            myContextMenu.hide();
                            $(this).dialog("close");
                        }
                    },
                    {
                        "text": gI18n.buttons.no,
                        "click": function() {
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        });
        myContextMenuText.find(".modifytext").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            // Handle text modify
            var myText = $("#" + myContextMenuText.attr("rel"));
            $("#textValue").val(myText.text());
            if (myText.css("stroke") !== "none") {
                $("#textColor").val(myText.css("stroke").substr(1));
            } else {
                $("#textColor").val("FFFFFF");
            }
            $("#textEdit").dialog({
                "resizable": false,
                "modal": true,
                "buttons": [
                    {
                        "text": gI18n.buttons.ok,
                        "click": function() {
                            if ($("#textValue").val().trim().length === 0) {
                                // The text is deleted if it's empty
                                myText.remove();
                                // Remove text from global configuration
                                var myElementIndex = myText.data("index");
                                gCurrentConf.texts.splice(myElementIndex, 1);
                                $("#textsOverlay text:not([rel])").each(function(i, el) {
                                    if ($(el).data("index") > myElementIndex) {
                                        $(el).data("index", $(el).data("index") - 1);
                                    }
                                });
                            } else {
                                myText.text($("#textValue").val());
                                gCurrentElement.value = myText.text();
                                myText.css("stroke", "#" + $("#textColor").val()).css("fill", "#" + $("#textColor").val());
                            }
                            $(this).dialog("close");
                        }
                    },
                    {
                        "text": gI18n.buttons.cancel,
                        "click": function() {
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        });
        myContextMenuElement.find(".modifytext").on("click", function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            // Handle text modify
            var myImage = $("#" + myContextMenuElement.attr("rel")),
                myText = $("#" + myImage.attr("rel")),
                myImagePosX = (myImage.attr("x") * 1),
                myImageWidth = (myImage.attr("width") * 1);
            $("#textValue").val(myText.text());
            if (myText.css("stroke") !== "none") {
                $("#textColor").val(myText.css("stroke").substr(1));
            } else {
                $("#textColor").val("FFFFFF");
            }
            $("#textEdit").dialog({
                "resizable": false,
                "modal": true,
                "buttons": [
                    {
                        "text": gI18n.buttons.ok,
                        "click": function() {
                            myText.text($("#textValue").val());
                            myText.css("stroke", "#" + $("#textColor").val()).css("fill", "#" + $("#textColor").val());
                            gCurrentElement.text.value = myText.text();
                            myTextWidth = myText[0].getComputedTextLength();
                            if (myText.hasClass("top")) {
                                myText.attr("x", myImagePosX + (myImageWidth / 2) - (myTextWidth / 2));
                                gCurrentElement.text.position.x = myText.attr("x") * 1;
                            } else if (myText.hasClass("bottom")) {
                                myText.attr("x", myImagePosX + (myImageWidth / 2) - (myTextWidth / 2));
                                gCurrentElement.text.position.x = myText.attr("x") * 1;
                            } else if (myText.hasClass("left")) {
                                myText.attr("x", myImagePosX - myTextWidth);
                                gCurrentElement.text.position.x = myText.attr("x") * 1;
                            }
                            $(this).dialog("close");
                        }
                    },
                    {
                        "text": gI18n.buttons.cancel,
                        "click": function() {
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        });
        myContextMenuElement.find(".textPosition").on("click", function(e) {
            var myLink = $(this);
            if (!myLink.hasClass("selected")) {
                var myImage = $("#" + myContextMenuElement.attr("rel")),
                    myText = $("#" + myImage.attr("rel")),
                    myImagePosX = (myImage.attr("x") * 1),
                    myImagePosY = (myImage.attr("y") * 1),
                    myImageWidth = (myImage.attr("width") * 1),
                    myImageHeight = (myImage.attr("height") * 1),
                    myTextWidth = myText[0].getComputedTextLength();
                myText.removeClass("top bottom left right");
                if (myLink.hasClass("top")) {
                    myText.attr("x", myImagePosX + (myImageWidth / 2) - (myTextWidth / 2));
                    myText.attr("y", myImagePosY);
                    gCurrentElement.text.position.rel = "top";
                    gCurrentElement.text.position.x = myText.attr("x") * 1;
                    gCurrentElement.text.position.y = myText.attr("y") * 1;
                    myText.addClass("top");
                } else if (myLink.hasClass("bottom")) {
                    myText.attr("x", myImagePosX + (myImageWidth / 2) - (myTextWidth / 2));
                    myText.attr("y", myImagePosY + myImageHeight + 10);
                    gCurrentElement.text.position.rel = "bottom";
                    gCurrentElement.text.position.x = myText.attr("x") * 1;
                    gCurrentElement.text.position.y = myText.attr("y") * 1;
                    myText.addClass("bottom");
                } else if (myLink.hasClass("left")) {
                    myText.attr("x", myImagePosX - myTextWidth);
                    myText.attr("y", myImagePosY + (myImageHeight / 2) + 7);
                    gCurrentElement.text.position.rel = "left";
                    gCurrentElement.text.position.x = myText.attr("x") * 1;
                    gCurrentElement.text.position.y = myText.attr("y") * 1;
                    myText.addClass("left");
                } else {
                    myText.attr("x", myImagePosX + myImageWidth);
                    myText.attr("y", myImagePosY + (myImageHeight / 2) + 7);
                    gCurrentElement.text.position.rel = "right";
                    gCurrentElement.text.position.x = myText.attr("x") * 1;
                    gCurrentElement.text.position.y = myText.attr("y") * 1;
                    myText.addClass("right");
                }
                myContextMenuElement.find(".textPosition").removeClass("selected");
                myLink.addClass("selected");
            }
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
            } else if (myResizedElement !== null) {
                myResizedElement.removeClass("resizing");
                myResizedElement = null;
                return;
            } else if (myRotatedElement !== null) {
                myRotatedElement.removeClass("rotating");
                myRotatedElement = null;
                return;
            }
            var selectedItem = $("#menuEditElements div .selected");
            if (selectedItem.length === 0) {
                selectedItem = $("#menuEditShapes div .selected");
                if (selectedItem.length === 0) {
                    selectedItem = $("#menu .selected");
                }
            }
            if (selectedItem.is("a")) {
                var myItemProps = selectedItem.attr("href").split(/\//g),
                    i = 0;
                switch (myItemProps[2]) {
                    case "element":
                        var elementType = myItemProps[3],
                            elementTeam = myItemProps[4],
                            myElem = gElements[elementType]["team" + elementTeam];
                        // Update serialization
                        addElement({
                            "type": elementType,
                            "team": elementTeam,
                            "position": {
                                "x": e.pageX - myCanvasContainer[0].offsetLeft - (myElem.size.x / 2),
                                "y": e.pageY - myCanvasContainer[0].offsetTop - (myElem.size.y / 2)
                            },
                            "text": {
                                "value": selectedItem.text() + " " + (gCountElems[elementType] + 1),
                                "position": {
                                    "rel": "right",
                                    "x": e.pageX - myCanvasContainer[0].offsetLeft + (myElem.size.x / 2),
                                    "y": e.pageY - myCanvasContainer[0].offsetTop + 7
                                }
                            }
                        });
                        break;
                    case "line":
                        break;
                    case "shape":
                        var myShapeConf = {
                            "type": myItemProps[3],
                            "position": {
                                "x": e.pageX - myCanvasContainer[0].offsetLeft,
                                "y": e.pageY - myCanvasContainer[0].offsetTop
                            },
                            "style": {}
                        }
                        switch (myShapeConf.type) {
                            case "ellipse":
                                myShapeConf.rx = 25;
                                myShapeConf.ry = 25;
                                break;
                            case "polygon":
                                break;
                            case "rect":
                                myShapeConf.width = 50;
                                myShapeConf.height = 50;
                                myShapeConf.rx = 0;
                                myShapeConf.ry = 0;
                                break;
                        }
                        addShape(myShapeConf);
                        break;
                    case "text":
                        addText({
                            "value": "Texte " + gCountTexts,
                            "position": {
                                "x": e.pageX - myCanvasContainer[0].offsetLeft,
                                "y": e.pageY - myCanvasContainer[0].offsetTop
                            },
                            "style": {}
                        });
                        break;
                    default:
                        break;
                }
            }
        })
        // Handle movement, rotation and resize of items
        .on("mousemove", function(e) {
            if (myDraggedElement !== null) {
                myDraggedElement.each(function(i, el) {
                    var elem = $(el);
                    if (elem.is("image")) {
                        elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft - (myDraggedElementWidth / 2));
                        elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop - (myDraggedElementHeight / 2));
                        gCurrentElement.position.x = elem.attr("x") * 1;
                        gCurrentElement.position.y = elem.attr("y") * 1;
                        elem.data("x", gCurrentElement.position.x);
                        elem.data("y", gCurrentElement.position.y);
                    } else if (elem.is("text")) {
                        if (gCurrentElement.text) {
                            // Attached text
                            if (elem.hasClass("top")) {
                                elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft - (myDraggedElementWidth / 2) + 12 - (elem[0].getComputedTextLength() / 2));
                                elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop - 12);
                            } else if (elem.hasClass("bottom")) {
                                elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft - (myDraggedElementWidth / 2) + 12 - (elem[0].getComputedTextLength() / 2));
                                elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop + 21);
                            } else if (elem.hasClass("left")) {
                                elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft - (myDraggedElementWidth / 2) - elem[0].getComputedTextLength());
                                elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop + 7);
                            } else {
                                elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft + (myDraggedElementWidth / 2));
                                elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop + 7);
                            }
                            gCurrentElement.text.position.x = elem.attr("x") * 1;
                            gCurrentElement.text.position.y = elem.attr("y") * 1;
                            elem.data("x", gCurrentElement.text.position.x);
                            elem.data("y", gCurrentElement.text.position.y);
                        } else {
                            // Plain text
                            elem.attr("x", e.pageX - myCanvasContainer[0].offsetLeft);
                            elem.attr("y", e.pageY - myCanvasContainer[0].offsetTop);
                            gCurrentElement.position.x = elem.attr("x") * 1;
                            gCurrentElement.position.y = elem.attr("y") * 1;
                            elem.data("x", gCurrentElement.position.x);
                            elem.data("y", gCurrentElement.position.y);
                        }
                    } else if (elem.is("rect")) {
                        gCurrentElement.position.x = e.pageX - myCanvasContainer[0].offsetLeft - elem.attr("width") / 2;
                        gCurrentElement.position.y = e.pageY - myCanvasContainer[0].offsetTop - elem.attr("height") / 2;
                        setShapePos(elem, gCurrentElement.position);
                    } else if (elem.is("ellipse")) {
                        gCurrentElement.position.x = e.pageX - myCanvasContainer[0].offsetLeft;
                        gCurrentElement.position.y = e.pageY - myCanvasContainer[0].offsetTop;
                        setShapePos(elem, gCurrentElement.position);
                    }
                });
            } else if (myResizedElement !== null) {
                if (myResizedElement.is("rect")) {
                    var actualWidth = myResizedElement.attr("width") * 1,
                        actualHeight = myResizedElement.attr("height") * 1,
                        actualPosX = myResizedElement.data("x"),
                        actualPosY = myResizedElement.data("y"),
                        newWidth = e.pageX - myCanvasContainer[0].offsetLeft - myResizedElement.data("originalposx"),
                        newHeight = e.pageY - myCanvasContainer[0].offsetTop - myResizedElement.data("originalposy"),
                        newPosX = actualPosX,
                        newPosY = actualPosY;
                    if (newWidth < 0) {
                        newWidth = Math.abs(newWidth);
                        newPosX = myResizedElement.data("originalposx") - newWidth;
                    }
                    if (newHeight < 0) {
                        newHeight = Math.abs(newHeight);
                        newPosY = myResizedElement.data("originalposy") - newHeight;
                    }
                    myResizedElement.attr("width", newWidth).attr("height", newHeight);
                    gCurrentElement.width = newWidth;
                    gCurrentElement.height = newHeight;
                    gCurrentElement.position.x = newPosX;
                    gCurrentElement.position.y = newPosY;
                    setShapePos(myResizedElement, gCurrentElement.position);
                } else if (myResizedElement.is("ellipse")) {
                    myResizedElement.attr("rx", Math.abs(e.pageX - myCanvasContainer[0].offsetLeft - (myResizedElement.attr("cx") * 1)))
                        .attr("ry", Math.abs(e.pageY - myCanvasContainer[0].offsetTop - (myResizedElement.attr("cy") * 1)));
                    gCurrentElement.rx = myResizedElement.attr("rx") * 1;
                    gCurrentElement.ry = myResizedElement.attr("ry") * 1;
                } else if (myResizedElement.is("polygon")) {
                    // TODO: Handle resize og polygons
                }
            } else if (myRotatedElement !== null) {
                // TODO: Handle rotation
                var elPosX = 0,
                    elPosY = 0,
                    angleToApply = 0,
                    radius = 1;
                elPosX = myRotatedElement.data("x");
                elPosY = myRotatedElement.data("y");
                // Reposition element to 0,0
                if (myRotatedElement.is("rect")) {
                    myRotatedElement.attr("x", 0);
                    myRotatedElement.attr("y", 0);
                } else if (myRotatedElement.is("ellipse")) {
                    myRotatedElement.attr("cx", 0);
                    myRotatedElement.attr("cy", 0);
                }
                radius = Math.sqrt(Math.pow(elPosX - e.pageX - myCanvasContainer[0].offsetLeft, 2) + Math.pow(elPosY - e.pageY - myCanvasContainer[0].offsetTop, 2));
                angleToApply = Math.acos((elPosX - e.pageX - myCanvasContainer[0].offsetLeft) / radius);
                if (elPosY > e.pageY - myCanvasContainer[0].offsetTop) {
                    angleToApply = -angleToApply;
                }
                angleToApply = angleToApply * 360 / Math.PI;
                myRotatedElement.attr("transform", "translate(" + elPosX + " " + elPosY + ") rotate(" + angleToApply + ")");
            }
        });
        $(".colorselector, #colorSelectorLine").ColorPicker({
            onSubmit: function(hsb, hex, rgb, el) {
                $(el).val(hex);
                $(el).ColorPickerHide();
            },
            onBeforeShow: function () {
                $(this).ColorPickerSetColor(this.value);
            }
        }).bind('keyup', function(){
            $(this).ColorPickerSetColor(this.value);
        });
        // Append colorpicker overlay to edit panel in order to prevent hiding of panel
        //$(".colorpicker").detach().appendTo($("#menuEditLines > div"));
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
                                myElements0 += "<li><a href=\"edit/add/element/" + myElementToken + "/0\" class=\"element " + myElementToken + "0\" rel=\"" + myElementToken + "0\" title=\"" + gI18n.games[myGameToken].elements[myElementToken] + "\"><span>" + gI18n.games[myGameToken].elements[myElementToken] + "</span></a></li>";
                            }
                            if (gElements[myElementToken].team1) {
                                myElements1 += "<li><a href=\"edit/add/element/" + myElementToken + "/1\" class=\"element " + myElementToken + "1\" rel=\"" + myElementToken + "1\" title=\"" + gI18n.games[myGameToken].elements[myElementToken] + "\"><span>" + gI18n.games[myGameToken].elements[myElementToken] + "</span></a></li>";
                            }
                            if (gElements[myElementToken].team2) {
                                myElements2 += "<li><a href=\"edit/add/element/" + myElementToken + "/2\" class=\"element " + myElementToken + "2\" rel=\"" + myElementToken + "2\" title=\"" + gI18n.games[myGameToken].elements[myElementToken] + "\"><span>" + gI18n.games[myGameToken].elements[myElementToken] + "</span></a></li>";
                            }
                        }
                        // Clear old elements and add the new ones
                        $("#elements").find("legend").siblings().remove();
                        $("#elements").append("<section class=\"flex flex-h\"><aside class=\"flex-start\"><ul class=\"elements\">" + myElements0 + "</ul></aside><aside class=\"flex-fluid\"><ul class=\"elements\">" + myElements1 + "</ul></aside><aside class=\"flex-end\"><ul class=\"elements\">" + myElements2 + "</ul></aside></section>");
                        $("#menuEditElements").find(".element").click(function(e) {
                            e.stopImmediatePropagation();
                            e.preventDefault();
                            $("#menuEditElements > a").attr("class", "");
                            if (!$(this).hasClass("selected")) {
                                $("#menu .selected").removeClass("selected");
                                $("#menuEditElements > a").addClass($(this).attr("rel") + " selected").attr("rel", $(this).attr("rel"));
                            } else {
                                $("#menuEditElements > a").removeAttr("rel");
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
                    $("#textsOverlay").remove();
                    $("#chkDirections").change();
                    $("#mapDesc .mapName").text(gI18n.games[myGameToken].maps[myMapToken]);
                    $("#mapDesc .mapMetrics").text(myMapObj.size.x + "m x " + myMapObj.size.y + "m");
                    $("#mapDesc .mapSquareLength").text("(1px = 1m)");
                    var myCanvas = myCanvasContainer.svg().svg("get");
                    // Update size of svg element
                    myCanvasContainer.children("svg").attr("width", myMapObj.size.x + gDECAL_GRID);
                    myCanvasContainer.children("svg").attr("height", myMapObj.size.y + gDECAL_GRID);
                    myCanvas.group(null, "elementsOverlay", {});
                    myCanvas.group(null, "linesOverlay", {});
                    myCanvas.group(null, "shapesOverlay", {});
                    myCanvas.group(null, "textsOverlay", {});
                    gCurrentConf.elements = [];
                    for (myElementToken in gElements) {
                        gCountElems[myElementToken] = 0;
                    }
                    gCurrentConf.texts = [];
                    gCurrentConf.shapes = [];
                    gCurrentConf.lines = [];
                });
                $("#selMode").change(function(e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    gCurrentConf.mode = $(this).val();
                    $("#basesOverlay").remove();
                    $("#chkBases").change();
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
                    gIsImporting = true;
                    var myConf = $.parseJSON(decodeURIComponent(escape(atob($("#txtImportExport").val()))));
                    $("#selGame").val(myConf.game).change();
                    window.setTimeout(function() {
                        $("#selMap").val(myConf.map).change();
                        window.setTimeout(function() {
                            var i = 0;
                            $("#selMode").val(myConf.mode).change();
                            for (i = 0; i<myConf.elements.length; i++) {
                                addElement(myConf.elements[i]);
                            }
                            for (i = 0; i<myConf.texts.length; i++) {
                                addText(myConf.texts[i]);
                            }
                            for (i = 0; i<myConf.shapes.length; i++) {
                                addShape(myConf.shapes[i]);
                            }
                            gCurrentConf = myConf;
                            gIsImporting = false;
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
