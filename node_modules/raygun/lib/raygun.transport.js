/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var http = require('http');
var https = require('https');

var API_HOST = 'api.raygun.io';

var getFullPath = function(options) {
  var useSSL   = options.useSSL,
      port     = useSSL ? 443 : 80,
      protocol = useSSL ? 'https' : 'http';

  return protocol + '://' + API_HOST + ':' + port + '/entries';
};

var send = function (options) {
  try {
    var data = new Buffer(JSON.stringify(options.message), 'utf8');
    var fullPath = getFullPath(options);

    var httpOptions = {
      host: options.host || API_HOST,
      port: options.port || 443,
      path: fullPath,
      method: 'POST',
      headers: {
        'Host': API_HOST,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-ApiKey': options.apiKey
      }
    };
    var cb = function (response) {
      if (options.callback) {
        if (options.callback.length > 1) {
          options.callback(null, response);
        } else {
          options.callback(response);
        }
      }
    };
    var httpLib = options.useSSL ? https : http;
    var request = httpLib.request(httpOptions, cb);

    request.on("error", function (e) {
      console.log("Raygun: error " + e.message + " occurred while attempting to send error with message: " + options.message);

      // If the callback has two parameters, it should expect an `error` value.
      if (options.callback && options.callback.length > 1) {
        options.callback(e);
      }
    });

    request.write(data);
    request.end();
  } catch (e) {
    console.log("Raygun: error " + e + " occurred while attempting to send error with message: " + options.message);
  }
};

exports.send = send;
