/*
 * Stephen Wai
 * app.js
 *
 */

// magic function to get url params
function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getEta(recipient, destination, mode, pos) {
  $.ajax({
    url: "/eta",
    type: 'GET',
    data: { recipient: recipient,
      destination: destination,
      mode: mode,
      lat: pos.lat,
      long: pos.long
    },
    contentType: 'application/json; charset=utf-8',
    success: function(data) {
      var responseBody = data;
      console.log("Success:" + responseBody);

      if (responseBody == "ZERO_RESULTS") {
        $("#origin-out").text("No results");
        return;
      }

      // TODO: bad code
      var origin = responseBody["origin_addresses"][0];
      var destination = responseBody["destination_addresses"][0];
      var duration = responseBody["rows"][0]["elements"][0]["duration"]["text"];

      // debug
      var debug = "origin: " + origin + " | destination: " + destination + " | duration: " + duration;
      console.log(debug);

      // update form fields
      $("#origin-out").text(origin);
      $("#destination-out").text(destination);
      $("#duration-out").text(duration);
    },
    error: function() {
      console.log("Error making AJAX request to ETA");
    }
  }); // end $.ajax
}

// submit click handler
$("#sendEta").click(function() {

  // get recipient destination from form
  var phone = $("#phone").val();
  var destination = $("#destination").val();
  var mode = $("#mode").val();
  var queryParams = "?recipient=" + encodeURIComponent(phone)
                    + "&destination=" + encodeURIComponent(destination)
                    + "&mode=" + mode;

  // reload page with params
  var page = location.protocol + "//" + location.host + "/" + queryParams;
  console.log("page: " + page);
  window.location = page;

});

// load onready
$(document).ready(function() {

    // DOM object for geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          long: position.coords.longitude
        };

        // get params from url if present
        var recipient = getParameterByName("recipient");
        var destination = getParameterByName("destination");
        var mode = getParameterByName("mode");

        // exit if no recipient, destination or long/lat
        // TODO: more validation
        if (!recipient || !destination || !pos)
          return;

        // fill out form with values
        $("#phone").val(recipient);
        $("#destination").val(destination);
        $("#mode").val(mode);

        // debug
        console.log("Calling service on document.ready");
        console.log("Coordinates, lat:" + pos.lat + " | long:" + pos.long);
        console.log("Recipient: " + recipient);
        console.log("Destination: " + destination);
        console.log("Mode: " + mode);

        // call AJAX
        getEta(recipient, destination, mode, pos);

    }); // end navigator.geolocation.getCurrentPosition
  } // end if(navigator.geolocation) {
}); // end document.ready
