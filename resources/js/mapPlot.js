// Enums used for the arrays below
var COLOR = {
    BLACK: 0,
    BLUE: 1,
    BROWN: 2,
    GREEN: 3,
    GRAY: 4,
    ORANGE: 5,
    PINK: 6,
    RED: 7,
    VIOLET: 8,
    WHITE: 9,
    YELLOW: 10,
    props: {
        0: {
            configVal: 'black',
            displayVal: 'Black'
        },
        1: {
            configVal: 'blue',
            displayVal: 'Blue'
        },
        2: {
            configVal: 'brown',
            displayVal: 'Brown'
        },
        3: {
            configVal: 'green',
            displayVal: 'Green'
        },
        4: {
            configVal: 'gray',
            displayVal: 'Gray'
        },
        5: {
            configVal: 'orange',
            displayVal: 'Orange'
        },
        6: {
            configVal: 'pink',
            displayVal: 'Pink'
        },
        7: {
            configVal: 'red',
            displayVal: 'Red'
        },
        8: {
            configVal: 'violet',
            displayVal: 'Violet'
        },
        9: {
            configVal: 'white',
            displayVal: 'White'
        },
        10: {
            configVal: 'yellow',
            displayVal: 'Yellow'
        },
        name: 'color',
        default: 7
    }
};

var DOTSIZE = {
    SMALL: 0,
    REGULAR: 1,
    BIG: 2,
    HUGE: 3,
    props: {
        0: {
            configVal: 10,
            displayVal: 'Small'
        },
        1: {
            configVal: 15,
            displayVal: 'Regular'
        },
        2: {
            configVal: 25,
            displayVal: 'Big'
        },
        3: {
            configVal: 35,
            displayVal: 'Huge'
        },
        name: 'dotSize',
        default: 1
    }
}

var LINESIZE = {
    THIN: 0,
    REGULAR: 1,
    THICK: 2,
    HUGE: 3,
    props: {
        0: {
            configVal: 3,
            displayVal: 'Thin'
        },
        1: {
            configVal: 5,
            displayVal: 'Regular'
        },
        2: {
            configVal: 10,
            displayVal: 'Thick'
        },
        3: {
            configVal: 30,
            displayVal: 'Huge'
        },
        name: 'lineSize',
        default: 1
    }
}

var OPACITY = {
    OPAQUE: 0,
    ALMOST_OPAQUE: 1,
    TRANSLUCENT: 2,
    TRANSPARENT: 3,
    props: {
        0: {
            configVal: 1.0,
            displayVal: 'Opaque'
        },
        1: {
            configVal: 0.9,
            displayVal: 'Almost Opaque'
        },
        2: {
            configVal: 0.6,
            displayVal: 'Translucent'
        },
        3: {
            configVal: 0.3,
            displayVal: 'Transparent'
        },
        name: 'opacity',
        default: 0
    }
}

// Points that will be drawn
//   Format:
//      coordinates — array of lat, long                                         (necessary)
//      color       — color of the dot; one of the constants above               (default: COLOR.RED)
//      size        — width & height of dot image; one of the constants above    (default: DOTSIZE.REGULAR)
//      hide        — do not draw this point; it can still be used in line paths (default: false)
//      label       - Label to show above the point                              (default: empty string)
var points =
    [{
        coordinates: [43.656484, -70.253161],
        color: COLOR.BLUE,
        size: DOTSIZE.REGULAR
    }, {
        coordinates: [33.448197, -112.073673],
        color: COLOR.RED,
        size: DOTSIZE.BIG,
        label: "Phoenix"
    }, ];
var numPoints = points.length;
var backupPoints = [];
var markers = []; //Array full of Google maps objects: Markers
var infoWindows = []; //Array full of Google maps objects: InfoWindows

// Lines that will be drawn
//   Format:
//      path      — indices into points array, can be any number of points. (necessary)
//      color     — color of the line; one of the constants above           (default: COLOR.RED)
//      thickness — width of the line; one of the constants above           (default: LINESIZE.REGULAR)
//      opacity   — opacity of the line; one of the constants above         (default: OPAQUE)
var lines =
    [{
        path: ["0-1"],
        color: COLOR.GREEN,
        thickness: LINESIZE.BIG,
        opacity: OPACITY.ALMOST_OPAQUE
    }, ];
var numLines = lines.length;
var backupLines = [];
var polyLines = []; //Array full of Google maps objects: PolyLines


//Startup function
$(function() {
    createGoogleMap();
    $("div#pointsAndLinesBox").dialog({
        modal: true,
        height: 600,
        maxHeight: 700,
        width: 680,
        maxWidth: 1000,
        resizeable: true,
        autoOpen: false,
        closeOnEscape: false,
        buttons: {
            OK: function() {
                if (interpretDialogBox()) {
                    if (numPoints > 0) {
                        createGoogleMap();
                    }

                    $(this).dialog("close");
                }
            }
        },
        close: function() {
            if (points.length == 0 && lines.length == 0) {
                points = backupPoints.slice();
                lines = backupLines.slice();
                numPoints = points.length;
                numLines = lines.length;
            }
        }
    });
    $("div#errorBox").dialog({
        modal: true,
        resizeable: false,
        autoOpen: false,
        draggable: false,
        width: 460,
        close: function() {
            //change dialog box title back to error
            $("div#errorBox").prop('title', 'Error');
            // Clear error text
            $("p#errorText").html("");
        }
    });
    $("div#quickPaste").dialog({
        modal: true,
        resizeable: true,
        autoOpen: false,
        draggable: true,
        width: 500,
        maxWidth: 1000,
        maxHeight: 700,
        buttons: {
            "Create New Map": function() {
                $("div#quickPaste-newMap-doubleCheck").dialog('open');
            },
            "Add to Existing Map": function() {
                var reverse = $("#radio-reverseOrder").is(":checked");
                if (parseQuickPaste(reverse, false)) {
                    createGoogleMap();
                    $(this).dialog('close');
                } else {
                    showErrorBox("Couldn't parse the pasted text");
                }

            }
        },
        close: function() {
            $("#quickPasteArea").val("").attr("placeholder", "");
            $("#draw-line-checkbox").removeAttr('checked');
            $("#polygon-line-checkbox").removeAttr('checked');
        }
    });
    $("div#quickPaste-newMap-doubleCheck").dialog({
        modal: true,
        resizeable: false,
        autoOpen: false,
        draggable: false,
        width: 460,
        buttons: {
            "Create the New Map": function() {
                var reverse = $("#radio-reverseOrder").is(":checked");
                if (parseQuickPaste(reverse, true)) {
                    createGoogleMap();
                    $(this).dialog('close');
                    $("div#quickPaste").dialog('close');
                } else {
                    showErrorBox("Couldn't parse the pasted text");
                    $(this).dialog('close');
                }

            },
            "No!": function() {
                $(this).dialog('close');
            }
        }
    });
    $("div#quickPaste input[name=order]").checkboxradio({
        icon: false
    }).change(function() {
        var placeholderText = $(this).attr("id") == "radio-reverseOrder" ? "Paste a list of long, lat" : "Paste a list of lat, long";
        $("#quickPasteArea").attr("placeholder", placeholderText);
        if ($(this).attr("id") == "radio-existing") {
            var existingPointsText = "<br>";
            for (var i = 0; i < numPoints; i++) {
                existingPointsText += points[i].coordinates.join(", ");
                existingPointsText += "<br>";
            }
            $("#existingPoints").html(existingPointsText);
            $("#quickPasteInput").hide();
            $("#quickPaste").parent().find("button").not(".ui-dialog-titlebar-close").hide();
            $("#existingPoints").show();
        } else {
            $("#existingPoints").empty().hide();
            $("#quickPasteInput").show();
            $("#quickPaste").parent().find("button").show();
        }
    });

    $("div#importExportBox").dialog({
        modal: true,
        width: 500,
        maxHeight: 700,
        maxWidth: 1000,
        resizeable: true,
        autoOpen: false,
        closeOnEscape: false,
        buttons: {
            OK: function() {
                if (importFromImportExportBox()) {
                    $(this).dialog("close");
                } else {
                    showErrorBox("Couldn't import from this data. Sorry.");
                }
            }
        }
    });
    $("div#importExportBox input[name=importOrExport]").checkboxradio({
        icon: false
    }).change(function() {
        if ($(this).attr("id") == "radio-import") {
            $("#importExportBox").parent().find("button").show();
            $("#importExportBox #exportArea").hide();
            $("#importExportBox #importArea #importTextArea").val(" ");
            $("#importExportBox #importArea").show();
        } else {
            $("#importExportBox").parent().find("button").not(".ui-dialog-titlebar-close").hide();
            $("#importExportBox #importArea").hide();
            //fill in the export area with the stringified objects
            $("#importExportBox #exportArea").empty();
            $("#importExportBox #exportArea").append("<textarea style='background-color:#ddd; border: 1px solid gray; margin:10px 30px; padding:3px; overflow:hidden;white-space:nowrap; width:400px; height:100px; resize:none; font-size:1.3em'></textarea>");
            $("#importExportBox #exportArea textarea").append(JSON.stringify(points) + "\n");
            $("#importExportBox #exportArea textarea").append(JSON.stringify(lines) + "\n");
            $("#importExportBox #exportArea textarea").append(numPoints + "\n");
            $("#importExportBox #exportArea textarea").append(numLines);
            $("#importExportBox #exportArea").append("<br><span style='margin: 0 auto; display:table'><strong>Save this text if you'd like to re-create this map.</strong></span>");
            $("#importExportBox #exportArea").show();
            $("#importExportBox #exportArea textarea").select();
        }
    });

    $("#topButtons").buttonset().css({
        top: 55,
        right: 15,
        position: 'absolute',
        fontSize: '1.1em'
    });
    $("button#pointsAndLineButton").button({
        // icon: "ui-icon-pencil",
    }).click(function(event) {
        fillInDialogBox();
        backupLines = lines.slice();
        backupPoints = points.slice();
        $("#quickPaste").dialog('close');
        $("div#pointsAndLinesBox").dialog('open');
    });
    $("button#quickPasteTopButton").button({
        // icon: "ui-icon-clipboard",
    }).click(function(event) {
        $("#pointsAndLinesBox").dialog('close');
        openQuickPaste();
    });
    $("button#importExportButton").button({
        // icon: "ui-icon-clipboard",
    }).click(function(event) {
        backupLines = lines.slice();
        backupPoints = points.slice();
        $("#pointsAndLinesBox").dialog('close');
        $("#quickPaste").dialog('close');
        openImportExportBox();
    });



    //Set up ctrl-v and ctrl-shift-v
    var shiftDown = false;
    var ctrlDown = false;
    var shiftKey = 16;
    var ctrlKey = 17;
    var vKey = 86;
    $(document).keydown(function(e) {
        if (e.keyCode == ctrlKey) {
            ctrlDown = true;
        }
        if (e.keyCode == shiftKey) {
            shiftDown = true;
        }
    }).keyup(function(e) {
        if (e.keyCode == ctrlKey) {
            ctrlDown = false;
        }
        if (e.keyCode == shiftKey) {
            shiftDown = false;
        }
        if (e.keyCode == vKey) {
            if (ctrlDown && shiftDown) {
                e.preventDefault();
                shiftDown = false;
                ctrlDown = false;
                openQuickPaste(true);
            } else if (ctrlDown) {
                e.preventDefault();
                ctrlDown = false;
                openQuickPaste(false);
            }
        }
    });
});

//Draw the points and lines onto map
function drawPointsAndLines(map) {
    clearMap();
    // Loop through the points array and add a marker for each.
    // Also extend the map bounds to show all the markers
    var icons = [];
    var bounds = new google.maps.LatLngBounds();
    var atLeastOnePoint = false;
    var atLeastOnePointHadLatModified = false;
    for (var i = 0; i < numPoints; i++) {
        var color = (points[i].color ? COLOR.props[points[i].color].configVal : COLOR.props[COLOR.props.default].configVal);
        if (points[i].hide) {
            color = "transparent";
        }
        var size = (points[i].size ? DOTSIZE.props[points[i].size].configVal : DOTSIZE.props[DOTSIZE.props.default].configVal);
        icons[i] = {
            url: 'resources/images/dot/' + color + '-dot.png',
            scaledSize: new google.maps.Size(size, size),
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point(size / 2, size / 2) // anchor
        };
        if (points[i].coordinates) {
            atLeastOnePoint = true;
            if (Number(points[i].coordinates[0]) > 85) {
                points[i].coordinates[0] = "85";
                atLeastOnePointHadLatModified = true;
            } else if (Number(points[i].coordinates[0]) < -85) {
                points[i].coordinates[0] = "-85"
                atLeastOnePointHadLatModified = true;
            }
            markers[i] = new google.maps.Marker({
                position: new google.maps.LatLng(points[i].coordinates[0], points[i].coordinates[1]),
                icon: icons[i],
                map: map
            });
            infoWindows[i] = new google.maps.InfoWindow({
                content: points[i].label
            });
            if (points[i].label && points[i].label !== "") {
                infoWindows[i].open(map, markers[i]);
            }
            bounds.extend(markers[i].getPosition());
        }
    }
    if (atLeastOnePoint) {
        if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
            var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
            var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
            bounds.extend(extendPoint1);
            bounds.extend(extendPoint2);
        }
        map.fitBounds(bounds);
    }

    // Loop through the lines array and add a polyLine for each.

    for (var i = 0; i < numLines; i++) {
        if (lines[i].path) {
            var color = (lines[i].color ? COLOR.props[lines[i].color].configVal : COLOR.props[COLOR.props.default].configVal);
            var thickness = (lines[i].thickness ? LINESIZE.props[lines[i].thickness].configVal : LINESIZE.props[LINESIZE.props.default].configVal);
            var opacity = (lines[i].opacity ? OPACITY.props[lines[i].opacity].configVal : OPACITY.props[OPACITY.props.default].configVal);
            var coordinates = [];
            var numCoordinates = lines[i].path.length;
            for (var j = 0; j < numCoordinates; j++) {
                var pointIndex = lines[i].path[j] + '';
                var range = pointIndex.split("-");
                var validRange = !isNaN(parseInt(range[0])) && !isNaN(parseInt(range[1]));
                var polygonRange = pointIndex.split("=");
                var validPolygonRange = !isNaN(parseInt(polygonRange[0])) && !isNaN(parseInt(polygonRange[1]));
                if (range.length > 1 && validRange && parseInt(range[0]) < parseInt(range[1]) && parseInt(range[0]) >= 0 && parseInt(range[1]) < numPoints) {
                    for (var k = parseInt(range[0]); k <= parseInt(range[1]); k++) {
                        coordinates.push({
                            lat: Number(points[k].coordinates[0]),
                            lng: Number(points[k].coordinates[1])
                        });
                    }

                } else if (polygonRange.length > 1 && validPolygonRange && parseInt(polygonRange[0]) < parseInt(polygonRange[1]) && parseInt(polygonRange[0]) >= 0 && parseInt(polygonRange[1]) < numPoints) {
                    for (var k = parseInt(polygonRange[0]); k <= parseInt(polygonRange[1]); k++) {
                        coordinates.push({
                            lat: Number(points[k].coordinates[0]),
                            lng: Number(points[k].coordinates[1])
                        });
                    }
                    coordinates.push({
                        lat: Number(points[polygonRange[0]].coordinates[0]),
                        lng: Number(points[polygonRange[0]].coordinates[1])
                    });
                } else if (pointIndex < numPoints && pointIndex >= 0) {
                    coordinates.push({
                        lat: Number(points[pointIndex].coordinates[0]),
                        lng: Number(points[pointIndex].coordinates[1])
                    });
                }

            }
            polyLines[i] = new google.maps.Polyline({
                path: coordinates,
                geodesic: true,
                strokeColor: color,
                strokeOpacity: opacity,
                strokeWeight: thickness,
                map: map
            });
            // allow right clicking to add points along the polyLine
            google.maps.event.addListener(polyLines[i], 'rightclick', function(event) {
                addPointDirectlyOnMap(event.latLng);
            });
        }
    }

    if (atLeastOnePointHadLatModified) {
        // add the plus or minus 85 warning
        showErrorBoxWithTitle("At least one point was modified to fit within latitude &plusmn;85.");
    }
}

// Creates the googleMap
function createGoogleMap() {
    var mapType = google.maps.MapTypeId.SATELLITE;
    if (window.googleMap != null) {
        mapType = window.googleMap.getMapTypeId();
    }
    var mapOptions = {
        zoom: 1,
        center: new google.maps.LatLng(33.310315, -111.915456),
        mapTypeId: mapType,
        tilt: 0,
        disableDoubleClickZoom: true,
        streetViewControl: false,
        zoomControl: false,
        mapTypeControl: true,
        scaleControl: true,
        rotateControl: false,
        fullscreenControl: false,
        disableDoubleClickZoom: true
    };
    window.googleMap = new google.maps.Map(document.getElementById('map'), mapOptions);
    drawPointsAndLines(window.googleMap);
    window.googleMap.addListener('rightclick', function(event) {
        addPointDirectlyOnMap(event.latLng);
    });
}


// Add a point into the points array and create a new marker
function addPointDirectlyOnMap(location) {

    points.push({
        coordinates: [location.lat(), location.lng()],
        color: COLOR.BLUE
    });
    numPoints++;

    var newPointNumber = markers.length;

    var color = (points[newPointNumber].color ? COLOR.props[points[newPointNumber].color].configVal : COLOR.props[COLOR.props.default].configVal);
    var size = DOTSIZE.props[DOTSIZE.props.default].configVal;

    var icon = {
        url: 'resources/images/dot/' + color + '-dot.png',
        scaledSize: new google.maps.Size(size, size),
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(size / 2, size / 2) // anchor
    };

    markers[newPointNumber] = new google.maps.Marker({
        position: new google.maps.LatLng(points[newPointNumber].coordinates[0], points[newPointNumber].coordinates[1]),
        icon: icon,
        map: window.googleMap
    });
}

//Puts the points and lines arrays into pointsAndLinesBox
function fillInDialogBox() {
    //Points
    var box = $("div#pointsAndLinesBox");
    box.empty();
    box.append('<h3>Points</h3>');
    for (var i = 0; i < numPoints; i++) {
        //Build the line item
        var removePointSpan = '<span class="ui-icon ui-icon-circle-minus remove-point" style="font-weight:normal; font-size:1.3em margin:-10px" id="remove-point-' + i + '" onclick="removePoint(this.id)"></span>';
        var indexSpan = '<span class="lineItem-num">' + i + '&nbsp</span>';
        var coordinatesInputBox = '<input type="text" style="width:190px" placeholder="lat, long" class="coordinates-point" id="coordinates-point-' + i + '"/>';
        var colorDropDown = generateDropDown('point', i, COLOR);
        var sizeDropDown = generateDropDown('point', i, DOTSIZE);
        var showCheckBox = '<input type="checkbox" class="show-point" id="show-point-' + i + '">';
        var labelInputBox = '<input type="text" style="width:155px" placeholder="label" class="label-point" id="label-point-' + i + '"/>';
        box.append('<div class="lineItem pointRow" id="point-' + i + '">' + removePointSpan + indexSpan + coordinatesInputBox + colorDropDown + sizeDropDown + showCheckBox + labelInputBox + '</div>');

        //Fill the line item with the proper values
        $('#coordinates-point-' + i).val(points[i].coordinates.join(', '));
        $('#' + COLOR.props.name + '-point-' + i).val((points[i].color ? points[i].color : COLOR.props.default));
        $('#' + DOTSIZE.props.name + '-point-' + i).val((points[i].size ? points[i].size : DOTSIZE.props.default));
        $('#show-point-' + i).prop("checked", !points[i].hide);
        $('#label-point-' + i).val(points[i].label);
    }
    box.append('<div class="lineItem" id="addPoint"><span class="ui-icon ui-icon-circle-plus" style="font-weight:normal; font-size:1.3em margin:-10px" onclick="addPoint()"></span></div>');


    box.append("<hr style='margin-top:35px'>");


    //Lines
    box.append('<h3>Lines</h3>');
    for (var i = 0; i < numLines; i++) {
        //Build the line item
        var removeLineSpan = '<span class="ui-icon ui-icon-circle-minus remove-line" style="font-weight:normal; font-size:1.3em margin:-10px" id="remove-line-' + i + '" onclick="removeLine(this.id)"></span>';
        var indexSpan = '<span class="lineItem-num">' + i + '&nbsp</span>';
        var pathInputBox = '<input type="text" style="width:170px" placeholder="list of point indices" class="path-line" id="path-line-' + i + '"/>';
        var colorDropDown = generateDropDown('line', i, COLOR);
        var sizeDropDown = generateDropDown('line', i, LINESIZE);
        var opacityDropDown = generateDropDown('line', i, OPACITY);
        box.append('<div class="lineItem lineRow" id="line-' + i + '">' + removeLineSpan + indexSpan + pathInputBox + colorDropDown + sizeDropDown + opacityDropDown + '</div>');

        //Fill the line item with the proper values
        $('#path-line-' + i).val(lines[i].path.join(', '));
        $('#' + COLOR.props.name + '-line-' + i).val((lines[i].color ? lines[i].color : COLOR.props.default));
        $('#' + LINESIZE.props.name + '-line-' + i).val((lines[i].thickness ? lines[i].thickness : LINESIZE.props.default));
        $('#' + OPACITY.props.name + '-line-' + i).val((lines[i].opacity ? lines[i].opacity : OPACITY.props.default));
    }
    box.append('<div class="lineItem" id="addLine"><span class="ui-icon ui-icon-circle-plus" style="font-weight:normal; font-size:1.3em margin:-10px" onclick="addLine()"></span></div>');

}

//Helper function that generates a drop down given one of the enums (e) (e.g., COLOR)
//The ID of the select tag will be the e name plus the className plus the idx passed in. (e.g., color-point-0)
function generateDropDown(className, idx, e) {
    var dropDownHTML = '<select id="' + e.props.name + '-' + className + '-' + idx + '" class="' + e.props.name + '-' + className + '">';
    for (var key in e) {
        // skip loop if the property is from prototype
        // or if not an enum value in the object (checks for int)
        if (!e.hasOwnProperty(key) || e[key] !== parseInt(e[key], 10)) {
            continue;
        }
        dropDownHTML += '<option value=' + e[key] + '>' + e.props[e[key]].displayVal + '</option>';
    }
    dropDownHTML += '</select>';
    return dropDownHTML;
}

//Adds a new point to the dialog box
function addPoint() {
    var newPointNumber = parseInt($("#addPoint").prev(".lineItem.pointRow").children("span.lineItem-num").first().html(), 10) + 1;
    if (isNaN(newPointNumber)) {
        newPointNumber = 0;
    }
    var newPointHTML = '<div class="lineItem pointRow" id="point-' + newPointNumber + '">';
    newPointHTML += '<span class="ui-icon ui-icon-circle-minus remove-point" style="font-weight:normal; font-size:1.3em margin:-10px" id="remove-point-' + newPointNumber + '" onclick="removePoint(this.id)"></span>';
    newPointHTML += '<span class="lineItem-num">' + newPointNumber + '&nbsp</span>';
    newPointHTML += '<input type="text" style="width:190px" placeholder="lat, long" class="coordinates-point" id="coordinates-point-' + newPointNumber + '"/>';
    newPointHTML += generateDropDown('point', newPointNumber, COLOR);
    newPointHTML += generateDropDown('point', newPointNumber, DOTSIZE);
    newPointHTML += '<input type="checkbox" class="show-point" id="show-point-' + newPointNumber + '">';
    newPointHTML += '<input type="text" style="width:155px" placeholder="label" class="label-point" id="label-point-' + newPointNumber + '"/>';
    newPointHTML += '</div>';
    $("div#addPoint").before(newPointHTML);
    $('#' + COLOR.props.name + '-point-' + newPointNumber).val(COLOR.props.default);
    $('#' + DOTSIZE.props.name + '-point-' + newPointNumber).val(DOTSIZE.props.default);
    $('#show-point-' + newPointNumber).prop("checked", true);
}

//Adds a new line to the dialog box
function addLine() {
    var newLineNumber = parseInt($("#addLine").prev(".lineItem.lineRow").children("span.lineItem-num").first().html(), 10) + 1;
    if (isNaN(newLineNumber)) {
        newLineNumber = 0;
    }
    var newLineHTML = '<div class="lineItem lineRow" id="line-' + newLineNumber + '">';
    newLineHTML += '<span class="ui-icon ui-icon-circle-minus remove-line" style="font-weight:normal; font-size:1.3em margin:-10px" id="remove-line-' + newLineNumber + '" onclick="removeLine(this.id)"></span>';
    newLineHTML += '<span class="lineItem-num">' + newLineNumber + '&nbsp</span>';
    newLineHTML += '<input type="text" style="width:170px" placeholder="list of point indices" class="path-line" id="path-line-' + newLineNumber + '"/>';
    newLineHTML += generateDropDown('line', newLineNumber, COLOR);
    newLineHTML += generateDropDown('line', newLineNumber, LINESIZE);
    newLineHTML += generateDropDown('line', newLineNumber, OPACITY);
    newLineHTML += '</div>';
    $("div#addLine").before(newLineHTML);
    $('#' + COLOR.props.name + '-line-' + newLineNumber).val(COLOR.props.default);
    $('#' + LINESIZE.props.name + '-line-' + newLineNumber).val(LINESIZE.props.default);
    $('#' + OPACITY.props.name + '-line-' + newLineNumber).val(OPACITY.props.default);
    $('#show-line-' + newLineNumber).prop("checked", true);
}

//Removes point from the dialog box
function removePoint(id) {
    $('#' + id).parent().remove();
    var newPointNumber = 0;
    $('.pointRow').each(function() {
        $(this).find(".lineItem-num").html(newPointNumber + "&nbsp");
        $(this).find(".remove-point").attr("id", "remove-point-" + newPointNumber);
        $(this).find(".coordinates-point").attr("id", "coordinates-point-" + newPointNumber);
        $(this).find("." + COLOR.props.name + "-point").attr("id", "" + COLOR.props.name + "-point-" + newPointNumber);
        $(this).find("." + DOTSIZE.props.name + "-point").attr("id", "" + DOTSIZE.props.name + "-point-" + newPointNumber);
        $(this).find(".show-point").attr("id", "show-point-" + newPointNumber);
        $(this).find(".label-point").attr("id", "label-point-" + newPointNumber);
        $(this).attr("id", "point-" + newPointNumber);
        newPointNumber++;
    });
}

//Removes line from the dialog box
function removeLine(id) {
    $('#' + id).parent().remove();
    var newLineNumber = 0;
    $('.lineRow').each(function() {
        $(this).find(".lineItem-num").html(newLineNumber + "&nbsp");
        $(this).find(".remove-line").attr("id", "remove-line-" + newLineNumber);
        $(this).find(".path-line").attr("id", "path-line-" + newLineNumber);
        $(this).find("." + COLOR.props.name + "-line").attr("id", "" + COLOR.props.name + "-line-" + newLineNumber);
        $(this).find("." + LINESIZE.props.name + "-line").attr("id", "" + LINESIZE.props.name + "-line-" + newLineNumber);
        $(this).find("." + OPACITY.props.name + "-line").attr("id", "" + OPACITY.props.name + "-line-" + newLineNumber);
        $(this).attr("id", "line-" + newLineNumber);
        newLineNumber++;
    });
}

// Takes what's in the dialog box and fills in the lines and points arrays accordingly
// return false if there was an issue.
function interpretDialogBox() {
    points = [];
    lines = [];
    returnValue = true;
    $(".lineItem-num").removeClass("invalid-lineItem-num");

    $('.pointRow').each(function(i) {
        var coordinates = $(this).find(".coordinates-point").val().split(",");
        var color = $(this).find("." + COLOR.props.name + "-point").val();
        var size = $(this).find("." + DOTSIZE.props.name + "-point").val();
        var show = $(this).find(".show-point").is(':checked');
        var label = $(this).find(".label-point").val();
        var invalid = false;
        if (coordinates.length == 2) {
            var lat = coordinates[0].trim();
            var lng = coordinates[1].trim();

            if (lat != "" && !isNaN(lat) && lat >= -90 && lat <= 90 &&
                lng != "" && !isNaN(lng) && lng >= -180 && lng <= 180) {
                points.push({
                    coordinates: [lat, lng],
                    color: color,
                    size: size,
                    hide: !show,
                    label: label
                });
            } else {
                invalid = true;
            }
        } else {
            invalid = true
        }
        if (invalid) {
            points = [];
            lines = [];
            $(".pointRow#point-" + i + " .lineItem-num").addClass("invalid-lineItem-num");
            showErrorBox("There's an issue with the coordinates in point " + i);
            returnValue = false;
            return false; //breaks out of each loop
        }
    });
    numPoints = points.length;


    //All the points were added successfully, now add the lines
    if (returnValue) {
        $('.lineRow').each(function(j) {
            var path = $(this).find(".path-line").val().split(",");
            var color = $(this).find("." + COLOR.props.name + "-line").val();
            var thickness = $(this).find("." + LINESIZE.props.name + "-line").val();
            var opacity = $(this).find("." + OPACITY.props.name + "-line").val();
            var invalid = false;

            // Loop over path, ensure all the points are present in points array

            var pathLength = path.length;
            var invalid = false;
            for (var i = 0; i < pathLength; i++) {
                path[i] = path[i].trim();
                if ((path[i] >= numPoints) || (i > 0 && path[i] == path[i - 1]) || path[i] == "" ||
                    ((path[i] + '').split("-").length > 1 &&
                        ((isNaN(parseInt((path[i] + '').split("-")[0])) || isNaN(parseInt((path[i] + '').split("-")[0]))) ||
                            (parseInt((path[i] + '').split("-")[0]) >= parseInt((path[i] + '').split("-")[1])) ||
                            (parseInt((path[i] + '').split("-")[0]) < 0) ||
                            (parseInt((path[i] + '').split("-")[0]) >= numPoints) ||
                            (parseInt((path[i] + '').split("-")[1]) < 0) ||
                            (parseInt((path[i] + '').split("-")[1]) >= numPoints))) ||
                    ((path[i] + '').split("=").length > 1 &&
                        ((isNaN(parseInt((path[i] + '').split("=")[0])) || isNaN(parseInt((path[i] + '').split("=")[0]))) ||
                            (parseInt((path[i] + '').split("=")[0]) >= parseInt((path[i] + '').split("=")[1])) ||
                            (parseInt((path[i] + '').split("=")[0]) < 0) ||
                            (parseInt((path[i] + '').split("=")[0]) >= numPoints) ||
                            (parseInt((path[i] + '').split("=")[1]) < 0) ||
                            (parseInt((path[i] + '').split("=")[1]) >= numPoints)))) {
                    invalid = true;
                }
            }
            if (!invalid) {
                lines.push({
                    path: path,
                    color: color,
                    thickness: thickness,
                    opacity: opacity
                });
            } else {
                points = [];
                lines = [];
                $(".lineRow#line-" + j + " .lineItem-num").addClass("invalid-lineItem-num");
                showErrorBox("There's an issue with the path in line " + j);
                returnValue = false;
                return false; //break out of each loop
            }
        });
    }
    numPoints = points.length;
    numLines = lines.length;
    return returnValue;
}

//Clears the map by setting map=null on all the markers and polyLines
function clearMap() {
    var markersLength = markers.length;
    var polyLinesLength = polyLines.length;
    for (var i = 0; i < markersLength; i++) {
        if (markers[i]) {
            markers[i].setMap(null);
        }
    }
    for (var i = 0; i < polyLinesLength; i++) {
        if (polyLines[i]) {
            polyLines[i].setMap(null);
        }
    }
    markers = [];
    polyLines = [];
}

//Fills the errorText paragraph and then displays the errorBox dialog box
function showErrorBox(text) {
    $("p#errorText").html(text);
    $("div#errorBox").dialog('open');
}

//Fills the errorText paragraph, sets the errorBox title, and then displays the errorBox dialog box
function showErrorBoxWithTitle(text, title) {
    $("p#errorText").html(text);
    $("div#errorBox").prop('title', title);
    $("div#errorBox").dialog('open');
}

// Grabs the lat and long from the keyboard and fills in the points.
// The lines array will be cleared.
// reverse === true means the order is assumed to be long,lat
function openQuickPaste(reverse) {
    if ($('#pointsAndLinesBox').dialog('isOpen') === true ||
        $('#errorBox').dialog('isOpen') === true ||
        $("#quickPaste").dialog("isOpen") === true ||
        $("#importExportBox").dialog("isOpen") === true) {
        return;
    }
    var placeholderText = reverse ? "Paste a list of long, lat" : "Paste a list of lat, long";
    $("#quickPasteArea").attr("placeholder", placeholderText).autogrow({
        vertical: true,
        horizontal: false,
        flickering: false
    }).val("").show();
    $("#quickPaste").parent().find("button").show();
    $("#existingPoints").empty().hide();
    if (reverse) {
        $("#radio-reverseOrder").prop("checked", true)
    } else {
        $("#radio-normalOrder").prop("checked", true);
    }
    $("#quickPasteArea").css("width", "450px").css("height", "300px");
    $("div#quickPaste input[name=order]").button("refresh");
    $("#quickPasteInput").show();
    $("#quickPaste").dialog('open');
    $("#quickPasteArea").focus();
}

function openImportExportBox() {
    $("#importExportBox").parent().find("button").show();
    $("#importTextArea").attr("placeholder", "Paste the string previously exported").autogrow({
        vertical: true,
        horizontal: false,
        flickering: false
    }).val("").empty().show();
    $("#importExportBox #exportArea").hide();
    $("#importExportBox #importArea #importTextArea").empty();
    $("#importExportBox #importArea").show();
    $("#radio-import").prop("checked", true)
    $("div#importExportBox input[name=importOrExport]").button("refresh");
    $("div#importExportBox").dialog('open');
}

//parses quickpaste text
function parseQuickPaste(reverse, clear) {
    var invalidCoordinateValue = "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";
    var newlyAdded = 0;
    backupLines = lines.slice();
    backupPoints = points.slice();

    if (clear) {
        lines = [];
        points = [];
    }

    var areaText = $("#quickPasteArea").val();
    var drawLine = $("#draw-line-checkbox").is(":checked") === true;
    var drawPolygon = $("#polygon-line-checkbox").is(":checked") === true;
    //special handling for AT format
    areaText = areaText.split(";").join("\n");
    areaText = areaText.split(")").join("");
    areaText = areaText.split("(").join("");

    var text = areaText.split('\n');
    var textLines = text.length;
    var valid = true;
    var onePartPerLine = false;
    var lat = invalidCoordinateValue;
    var lng = invalidCoordinateValue;
    var readyToAdd = false;
    for (var i = 0; i < textLines; i++) {
        lineSplit = text[i].split(',');
        if (lineSplit.length == 1 && lineSplit[0] != "") {
            onePartPerLine = true;
        } else if (lineSplit.length == 0 || (lineSplit.length == 1 && lineSplit[0] == "")) {
            continue;
        } else if (lineSplit.length != 2) {
            valid = false;
            break;
        }
        if (onePartPerLine) {
            if (lineSplit.length != 1) {
                valid = false;
                break;
            }
            if (reverse) {
                if (lng == invalidCoordinateValue) {
                    lng = lineSplit[0];
                } else {
                    lat = lineSplit[0];
                }
            } else {
                if (lat == invalidCoordinateValue) {
                    lat = lineSplit[0];
                } else {
                    lng = lineSplit[0];
                }
            }
        } else {
            if (reverse) {
                lng = lineSplit[0];
                lat = lineSplit[1];
            } else {
                lat = lineSplit[0];
                lng = lineSplit[1];
            }
        }

        if (lat != invalidCoordinateValue && lng != invalidCoordinateValue) {
            if (lat != "" && !isNaN(lat) && lat >= -90 && lat <= 90 &&
                lng != "" && !isNaN(lng) && lng >= -180 && lng <= 180) {
                points.push({
                    coordinates: [lat.trim(), lng.trim()]
                });
                lat = invalidCoordinateValue;
                lng = invalidCoordinateValue;
                newlyAdded++;
            } else {
                valid = false;
                break;
            }
        }
    }
    var pointsLength = points.length
    var startIdx = pointsLength - newlyAdded;
    var endIdx = pointsLength - 1;
    if (valid && drawLine && !drawPolygon && newlyAdded > 0) {
        var linePath = [];
        linePath.push(startIdx + "-" + endIdx)
        lines.push({
            path: linePath
        });
    }
    if (valid && drawPolygon && newlyAdded > 0) {
        // go back through and hide all the polygon's points
        for (var i = 0; i < newlyAdded; i++) {
            points[pointsLength - 1 - i].hide = true;
        }
        var polygonPath = [];
        polygonPath.push(startIdx + "=" + endIdx)
        lines.push({
            path: polygonPath
        });
    }
    if (!valid || newlyAdded == 0) {
        valid = false;
        lines = backupLines.slice();
        points = backupPoints.slice();
    }
    numLines = lines.length;
    numPoints = points.length;
    return valid;
}

function importFromImportExportBox() {
    var rawInput = $("#importExportBox #importTextArea").val().trim().split('\n');
    var importText = rawInput.filter(e => String(e).trim());
    try {
        if (importText.length != 4) {
            throw "wrong number of lines in import text";
        }
        points = JSON.parse(importText[0]);
        lines = JSON.parse(importText[1]);
        if (points.length != parseInt(importText[2])) {
            throw "the number of points don't match";
        }
        if (lines.length != parseInt(importText[3])) {
            throw "the number of lines don't match";
        }
        numPoints = points.length;
        numLines = lines.length;
        createGoogleMap();
    } catch (err) {
        points = backupPoints.slice();
        lines = backupLines.slice();
        numPoints = points.length;
        numLines = lines.length;
        createGoogleMap();
        return false;
    }
    return true;
}