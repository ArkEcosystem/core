/*jshint unused:vars */

/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var raygunTransport = require('./raygun.transport');

var OfflineStorage = function() {
  var storage = this;

  function _sendAndDelete(item) {
    fs.readFile(
        path.join(storage.cachePath, item),
        'utf8',
        function(err, cacheContents) {
          raygunTransport.send(JSON.parse(cacheContents));
          fs.unlink(path.join(storage.cachePath, item));
        }
    );
  }

  storage.init = function(offlineStorageOptions) {
    if (!offlineStorageOptions && !offlineStorageOptions.cachePath) {
      throw new Error("Cache Path must be set before Raygun can cache offline");
    }

    storage.cachePath = offlineStorageOptions.cachePath;
    storage.cacheLimit = offlineStorageOptions.cacheLimit || 100;

    if (!fs.existsSync(storage.cachePath)) {
      fs.mkdirSync(storage.cachePath);
    }

    return storage;
  };

  storage.save = function(transportItem, callback) {
    var filename = path.join(storage.cachePath, Date.now() + '.json');
    delete transportItem.callback;

    if (!callback) {
      callback = function() {};
    }

    fs.readdir(storage.cachePath, function(err, files) {
      if (err) {
        console.log("[Raygun] Error reading cache folder");
        console.log(err);
        return callback(err);
      }

      if (files.length > storage.cacheLimit) {
        console.log("[Raygun] Error cache reached limit");
        return callback(null);
      }

      fs.writeFile(filename, JSON.stringify(transportItem), 'utf8',
        function(err) {
          if (!err) {
            return callback(null);
          }

          console.log("[Raygun] Error writing to cache folder");
          console.log(err);

          return callback(err);
        });
    });
  };

  storage.retrieve = function(callback) {
    fs.readdir(storage.cachePath, callback);
  };

  storage.send = function(callback) {
    if (!callback) {
      callback = function() {};
    }

    storage.retrieve(function(err, items) {
      if (err) {
        console.log("[Raygun] Error reading cache folder");
        console.log(err);
        return callback(err);
      }

      for (var i = 0; i < items.length; i++) {
        _sendAndDelete(items[i]);
      }

      callback(err, items);
    });
  };
};

exports = module.exports = OfflineStorage;
