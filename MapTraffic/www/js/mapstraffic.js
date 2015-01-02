var server = 'http://128.199.139.117:8080';
//var server = 'http://127.0.0.1';
// var server = 'http://10.0.3.2';
var dataJsonStreet;
var directionDisplay;
var directionsService = new google.maps.DirectionsService(); //gọi direction service
var map;
var arrLatLng;
var flightPath;
var isCheckGetLocation = 0;
var currentLocation = 0;
var isCheckGetLocationStart = 0;
var isCheckGetLocationEnd = 0;
var responseServer;
var myloc;
var circle;
var cityCircle;
var arrMarkers = [];
var CircleOptions = {
      strokeColor: '#6699CC',
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: '#6699CC',
      fillOpacity: 0.35,
      radius: 500
    };
 var cityCircle = new google.maps.Circle(CircleOptions);

document.addEventListener("backbutton", onBackKeyDown, false);

function onBackKeyDown() {
    navigator.app.exitApp();
}


function onDeviceReady() {
    //alert('ready');
    navigator.geolocation.watchPosition(onSuccessPos, onError, {
        timeout: 10000,
        enableHighAccuracy: true
    });
}

// Function get current location from device
function onSuccessPos(position) {
    currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    myloc.setPosition(currentLocation);
    
    cityCircle.setCenter(currentLocation);
    //map.fitBounds(cityCircle.getBounds());
    for (var i = 0; i < arrLatLng.length; i++) {
        if (getDistance(currentLocation, arrLatLng[i].getPosition()) < 100) {
            // alert('warning police!!!');
            //get API cordova vibrate
            navigator.vibrate([1000, 1000, 3000, 1000, 5000]); //vibrate 1s -> wait 1s -> vibrate 3s -> wait 1s -> vibrate 5s
            navigator.vibrate(3000); //vibrate for 3 seconds.
            playMP3();
        }
    }
}
var rad = function(x) {
    return x * Math.PI / 180;
};

//get distance from 2 point on map
var getDistance = function(p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
};

function onError(error) {
    //alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

function initialize() {
    document.addEventListener("deviceready", onDeviceReady, false);
    
    directionsDisplay = new google.maps.DirectionsRenderer();
    var locationTemp;
    if(currentLocation !== 0){
        locationTemp = currentLocation;
    }else{
        locationTemp = new google.maps.LatLng(10.87178429, 106.80741102);
    }
    var mapOptions = {
        center: locationTemp,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions); //hiển thị các thông báo khi chỉ dẫn
    directionsDisplay.setMap(map);
    cityCircle.setMap(map);
    //directionsDisplay.setPanel(document.getElementById('directions-panel'));//hiển thị các kết quả chỉ dẫn

    // var pac_input = document.getElementById('point_start');
    // new google.maps.places.Autocomplete(pac_input);

    var myLocation = document.getElementById('my_location');
    myLocation.style.display = 'block';
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(myLocation);
    google.maps.event.addListener(map, 'click', function(event) {
        console.log('Click Map');
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        if (isCheckGetLocation === 1) {
            $('#latitude_location').val(lat);
            $('#longitude_location').val(lng);
            window.history.back();
            isCheckGetLocation = 0;
        }
        if (isCheckGetLocationStart === 1) {
            $('#point_start').val(lat + "," + lng);
            window.history.back();
            isCheckGetLocationStart = 0;
        }
        if (isCheckGetLocationEnd === 1) {
            $('#point_end').val(lat + "," + lng);
            window.history.back();
            isCheckGetLocationEnd = 0;
        }
    });

    myloc = new google.maps.Marker({
        clickable: false,
        icon: new google.maps.MarkerImage('img/showlocation.png', 
            new google.maps.Size(22, 22), 
            new google.maps.Point(0, 18), 
            new google.maps.Point(11, 11)
            
            //new google.maps.Size(44, 44)
            ),
        shadow: null,
        zIndex: 999,
        map: map
    });
    // new google.maps.Size(22, 22), 
    //         new google.maps.Point(0, 18), 
    //         new google.maps.Point(11, 11),
    //         new google.maps.Size(88, 80)

   
}

function calcRoute() {
    console.log("Search derection");
    // var selectedMode = document.getElementById('mode').value;
    // var start = document.getElementById('start').value; //điểm bắt đầu do người dùng chọn
    // var end = document.getElementById('end').value; //điểm kết thúc do người dùng chọn
    var selectedMode = $('#modeTravel').val();
    var start = $('#point_start').val();
    var end = $('#point_end').val();
    //console.log(selectedMode +"  " +start+ "  "+ stop);
    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode[selectedMode] //phương thức di chuyển
    };
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response); //tìm kiếm các đường di chuyển
            var route = response.routes[0];
            //var summaryPanel = document.getElementById('dataJson');
            // var summaryPanel = document.getElementById('directions_panel');
            //summaryPanel.innerHTML = '';
            //get location representing to draw street
            arrLatLng = new Array();
            while (arrLatLng.length) {
                arrLatLng.pop();
            }
            dataJsonStreet = '{\"street\":[';
            for (var i = 0; i < route.overview_path.length; i++) {
                //console.log(route.overview_path[i].toSource());
                dataJsonStreet += "{\"latitude\":\"" + route.overview_path[i].k + "\",\"longitude\":\"" + route.overview_path[i].D + "\"},";
                //arrLatLng.push(new google.maps.LatLng(route.overview_path[i].k, route.overview_path[i].D));
            }

            map.setZoom(16); 
            map.setCenter(new google.maps.LatLng(route.overview_path[0].k, route.overview_path[0].D));
            /*
             flightPath = new google.maps.Polyline({
              path: arrLatLng,
              geodesic: true,
              strokeColor: '#EE0000',
              strokeOpacity: 1.0,
              strokeWeight: 4
            });

            // Dùng hàm setMap để gắn vào bản đồ
            flightPath.setMap(map);
        */
            var lengthDataJson = dataJsonStreet.length;
            dataJsonStreet = dataJsonStreet.substring(0, lengthDataJson - 1);
            dataJsonStreet += ']}';
            //console.log(dataJsonStreet);
            //post data into server
            postDataToServer(dataJsonStreet);
            //alert("Success");
            //summaryPanel.innerHTML += dataJsonStreet + "<br>Length: " + arrLatLng.length;
            //summaryPanel.innerHTML += arrLatLng.toString();
            // Các tọa độ của đường thẳng sẽ đi qua
            // flightPath.setMap(null);
        }
    });
}

//function post data to server
function postDataToServer(data) {
    // if (token == '')
    //   token = doCheck();
    //console.log('post to server');
    console.log(data);
    $.post(server, data, function(dataResponse, status, xhr) {
        responseServer = dataResponse.Message;
        var arrLocations = dataResponse.AllFound;
        setMarkers(map, arrLocations);
        console.log(arrLatLng);
    }, 'json').done(function() {
        console.log("second success");
    }).fail(function() {
        console.log("error");
    }).always(function() {
        console.log("finished");
    });
}

//function add marker into map show location need note.
function setMarkers(map, locations) {
    for (var i = 0; i < locations.length; i++) {
        var address = locations[i].diadiem;
        var lat = locations[i].locationX;
        var lng = locations[i].locationY;
        var error = locations[i].loivipham;
        latlngset = new google.maps.LatLng(lat, lng);
        var marker = new google.maps.Marker({
            map: map,
            title: address,
            position: latlngset
        });
        arrLatLng.push(marker);
        map.setCenter(marker.getPosition());
        var contentString = $('<div class="marker-info-win">' + '<div class="marker-inner-win"><span class="info-content">' + '<h4 class="marker-heading">' + address + '</h4>' + error + '</span>' + '</div></div>');
        var infowindow = new google.maps.InfoWindow();
        console.log(contentString);
        infowindow.setContent(contentString[0]);
        google.maps.event.addListener(marker, 'click', (function(marker, contentString, infowindow) {
            return function() {
                infowindow.open(map, marker);
            };
        })(marker, contentString[0], infowindow));
    }
}

function postLocationToServer(data) {
    console.log('Post Location');
    // $.post(server, data, function() {
    //     console.log("success");
    // }).done(function() {
    //     console.log("second success");
    // }).fail(function() {
    //     console.log("error");
    // }).always(function() {
    //     console.log("finished");
    // });
    $.ajax({
        url: server,
        data: data
    }).done(function(data) {
        //alert("Success: " + data.param1);
    }).fail(function() {
        //alert("Error");
    });
}

//event get street and get possition to noted
$("#btn_get_street_ok").click(function() {
    //console.log("Post Data");
    calcRoute();
});
//event get location by click on map
$("#get_location_from_map").click(function() {
    //deleteMarkers();
    isCheckGetLocation = 1;
    isCheckGetLocationEnd = 0;
    isCheckGetLocationStart = 0;
});

//event click button to post location to server
$("#btn_location_ok_post").click(function() {
    console.log("Add Data");
    var loc = $('#address_location').val();
    var lat = $('#latitude_location').val();
    var lng = $('#longitude_location').val();
    var err = $('#error_location').val();
    if (loc !== "" && lat !== "" && lng !== "" && err !== "") {
        var strJson = '{\"diadiem\":\"' + loc + '\",\"locationX\":' + lat + ',\"locationY\":' + lng + ',\"loivipham\":\"' + err + '\"}';
        // var strJson = '{\"diadiem\":\"'+loc+'\",\"locationX\":\"'+lat+'\",\"locationY\":\"'+lng+'\",\"loivipham\":\"'+err+'\"}';
        postDataToServer(strJson);
        alert("Thank for submit!");
        console.log(strJson);
    }
});

//event click get current location
$("#my_location").click(function() {
    //alert(currentLocation.toString());
    map.setCenter(currentLocation);
});
$("#get_location_start_from_map").click(function() {
    deleteMarkers();
    isCheckGetLocation = 0;
    isCheckGetLocationEnd = 0;
    isCheckGetLocationStart = 1;
});
$("#get_location_end_from_map").click(function() {
    deleteMarkers();
    isCheckGetLocation = 0;
    isCheckGetLocationEnd = 1;
    isCheckGetLocationStart = 0;
});

//function play mp3 _ API from cordova.
function playMP3() {
    var mp3URL = getMediaURL("sounds/button-1.mp3");
    var media = new Media(mp3URL, null, mediaError);
    media.play();
}

function getMediaURL(s) {
    if (device.platform.toLowerCase() === "android") return "/android_asset/www/" + s;
    return s;
}

function deleteMarkers() {
        //Loop through all the markers and remove
        for (var i = 0; i < arrLatLng.length; i++) {
            arrLatLng[i].setMap(null);
        }
        arrLatLng = [];
    };
// $( document ).on( "pageinit", "#mainPager", function() {
//     $( document ).on( "swipeleft swiperight", "#mainPager", function( e ) {
//         // We check if there is no open panel on the page because otherwise
//         // a swipe to close the left panel would also open the right panel (and v.v.).
//         // We do this by checking the data that the framework stores on the page element (panel: open).
//         if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
//             if ( e.type === "swipeleft"  ) {
//                 $( "#right-panel" ).panel( "open" );
//             } else if ( e.type === "swiperight" ) {
//                 $( "#left-panel" ).panel( "open" );
//             }
//         }
//     });
// });
google.maps.event.addDomListener(window, 'load', initialize);