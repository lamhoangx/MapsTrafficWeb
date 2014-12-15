
var server = 'http://128.199.139.117';
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

function onDeviceReady(){
	alert('ready');
    navigator.geolocation.watchPosition(onSuccessPos, onError, {timeout: 10000, enableHighAccuracy: true});
    
}
function onSuccessPos(position){
    currentLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
}

function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function initialize() {
	document.addEventListener("deviceready", onDeviceReady, false);
    directionsDisplay = new google.maps.DirectionsRenderer();
    var mapOptions = {
        center: new google.maps.LatLng(10.87178429, 106.80741102),
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions); //hiển thị các thông báo khi chỉ dẫn
    directionsDisplay.setMap(map);
    //directionsDisplay.setPanel(document.getElementById('directions-panel'));//hiển thị các kết quả chỉ dẫn
    var myLocation = document.getElementById('my_location');
    myLocation.style.display = 'block';
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(myLocation);

    google.maps.event.addListener(map, 'click', function(event) {
        console.log('Click Map');
            var lat = event.latLng.lat();
            var lng = event.latLng.lng();
        if(isCheckGetLocation===1){
            $('#latitude_location').val(lat);
            $('#longitude_location').val(lng);
            window.history.back();
            isCheckGetLocation = 0;
        }
        if(isCheckGetLocationStart===1){
        	$('#point_start').val(lat+","+lng);
        	window.history.back();
        	isCheckGetLocationStart = 0;
        }
        if(isCheckGetLocationEnd===1){
        	$('#point_end').val(lat+","+lng);
        	window.history.back();
        	isCheckGetLocationEnd = 0;

        }
    });
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
                arrLatLng.push(new google.maps.LatLng(route.overview_path[i].k, route.overview_path[i].D));
            }

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

function postDataToServer(data) {
    console.log('post to server');
    $.post(server, data, function() {
        console.log("success");
    }).done(function() {
        console.log("second success");
    }).fail(function() {
        console.log("error");
    }).always(function() {
        console.log("finished");
    });

    console.log('finish post');
}


function postLocationToServer(data){
    console.log('Post Location');
    $.post(server,data,function() {
        console.log("success");
    }).done(function() {
        console.log("second success");
    }).fail(function() {
        console.log("error");
    }).always(function() {
        console.log("finished");
    });
}

$("#btn_get_street_ok").click(function() {
    //console.log("Post Data");
    calcRoute();
});

$("#get_location_from_map").click(function(){
    isCheckGetLocation = 1;
	isCheckGetLocationEnd = 0;
	isCheckGetLocationStart = 0;
});

$("#btn_location_ok_post").click(function() {
    console.log("Add Data");
    var loc = $('#address_location').val();
    var lat = $('#latitude_location').val();
    var lng = $('#longitude_location').val();
    var err = $('#error_location').val();
    if(loc!=="" && lat !=="" && lng!=="" && err !==""){
        var strJson = '{\"diadiem\":\"'+loc+'\",\"locationX\":'+lat+',\"locationY\":'+lng+',\"loivipham\":\"'+err+'\"}';
        // var strJson = '{\"diadiem\":\"'+loc+'\",\"locationX\":\"'+lat+'\",\"locationY\":\"'+lng+'\",\"loivipham\":\"'+err+'\"}';
        postDataToServer(strJson);
        alert("Thank for submit!");
        console.log(strJson);
    }
});

$("#my_location").click(function(){
	alert(currentLocation.toString());
    map.setCenter(currentLocation);
});

$("#get_location_start_from_map").click(function(){
	isCheckGetLocation = 0;
	isCheckGetLocationEnd = 0;
	isCheckGetLocationStart = 1;

});

$("#get_location_end_from_map").click(function(){
	isCheckGetLocation = 0;
	isCheckGetLocationEnd = 1;
	isCheckGetLocationStart = 0;
});

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
