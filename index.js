/*
 * Stephen Wai
 * index.js
 */

'use strict';

var express = require('express');
var envvar = require('envvar');
var request = require('request');

var TWILIO_ACCOUNT_SID = envvar.string('TWILIO_ACCOUNT_SID');
var TWILIO_AUTH_TOKEN = envvar.string('TWILIO_AUTH_TOKEN');
var TWILIO_NUMBER = envvar.string('TWILIO_NUMBER');

var GOOGLE_MAP_KEY = envvar.string('GOOGLE_MAPS_KEY');

var client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

var DEFAULT_SMS_RECIPIENT="+15555555";
var DEFAULT_DESTINATION = "Embarcadero, San Francisco, CA";
var DEFAULT_MODE = "driving";
var MESSAGE_BODY = "On my way! ETA ";

var app = express();
app.use(express.static('public'));
app.set('port', (process.env.PORT || 5000));

app.get('/eta', function (req, res) {

  // req parameters
  var lat = req.query.lat;
  var long = req.query.long;
  var recipient = req.query.recipient || DEFAULT_SMS_RECIPIENT;
  var destination = req.query.destination || DEFAULT_DESTINATION;
  var mode = req.query.mode || DEFAULT_MODE;

  // set params for Google Maps call
  //var origins = "645 Harrison St, San Francisco, CA";
  // https://developers.google.com/maps/documentation/distance-matrix/
  var origins = lat + "," + long;
  var googleUrl = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + origins +
                    "&destinations=" + destination +
                    "&units=imperial" +
                    "&mode=" + mode +
                    "&key=" + GOOGLE_MAP_KEY;
  var sms = MESSAGE_BODY;

  // debug
  console.log(googleUrl);

  // call Google Maps API
  request(googleUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        // debug
        console.log(body);

        var responseBody = JSON.parse(body);
        var results = responseBody["rows"]

        // check no results
        var resultStatus = results[0]["elements"][0]["status"];
        if (resultStatus == "ZERO_RESULTS")
          return res.send("ZERO_RESULTS");

        // get results
        var duration = results[0]["elements"][0]["duration"]["text"];
        var distance = results[0]["elements"][0]["distance"]["text"];
        var origin = responseBody["origin_addresses"][0];
        sms += duration + " from " + origin;

        // call Twilio API to text recipient
        sendSMS(recipient, sms);

        // write response
        res.send(responseBody);
      }
  }) // end request call

});

function sendSMS(recipient, body) {
  client.sendMessage({
    to: recipient,
    from: TWILIO_NUMBER,
    body: body

  }, function(error, message) {
    if (!error) {
      console.log('Success! The SID for this SMS message is:');
      console.log(message.sid);

      console.log('Message sent on:');
      console.log(message.dateCreated);
    } else {
      console.log('Oops! There was an error.');
    }
  });
}

var server = app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port'));
});
