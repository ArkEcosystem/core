/*jshint unused:vars */

/*
 * raygun
 * https://github.com/MindscapeHQ/raygun4node
 *
 * Copyright (c) 2015 MindscapeHQ
 * Licensed under the MIT license.
 */

'use strict';

var raygunTransport = require('./raygun.transport');
var MessageBuilder = require('./raygun.messageBuilder');
var OfflineStorage = require('./raygun.offline');

var Raygun = function () {
    var _apiKey, _filters, raygun = this, _user, _version, _host, _port, _useSSL, _onBeforeSend, _offlineStorage, _isOffline, _offlineStorageOptions, _groupingKey, _tags, _useHumanStringForObject, _reportColumnNumbers, _innerErrorFieldName;

    raygun.init = function (options) {
        _apiKey = options.apiKey;
        _filters = options.filters;
        _host = options.host;
        _port = options.port;
        _useSSL = options.useSSL !== false;
        _onBeforeSend = options.onBeforeSend;
        _offlineStorage = options.offlineStorage || new OfflineStorage();
        _offlineStorageOptions = options.offlineStorageOptions;
        _isOffline = options.isOffline;
        _groupingKey = options.groupingKey;
        _tags = options.tags;
        _useHumanStringForObject = options.useHumanStringForObject === undefined ? true : options.useHumanStringForObject;
        _reportColumnNumbers = options.reportColumnNumbers;
        _innerErrorFieldName = options.innerErrorFieldName || 'cause'; // VError function to retrieve inner error;

        if (_isOffline) {
            _offlineStorage.init(_offlineStorageOptions);
        }

        return raygun;
    };

    raygun.user = function (req) {
        return;
    };

    // This function is deprecated, is provided for legacy apps and will be
    // removed in 1.0: use raygun.user instead
    raygun.setUser = function (user) {
        _user = user;
        return raygun;
    };

    raygun.expressCustomData = function () {
        return {};
    };

    raygun.setVersion = function (version) {
        _version = version;
        return raygun;
    };

    raygun.onBeforeSend = function (onBeforeSend) {
        _onBeforeSend = onBeforeSend;
        return raygun;
    };

    raygun.groupingKey = function (groupingKey) {
        _groupingKey = groupingKey;
        return raygun;
    };

    raygun.offline = function () {
        _offlineStorage.init(_offlineStorageOptions);
        _isOffline = true;
    };

    raygun.online = function (callback) {
        _isOffline = false;
        _offlineStorage.send(callback);
    };

    raygun.setTags = function (tags) {
        _tags = tags;
    };

    raygun.send = function (exception, customData, callback, request, tags) {
        var mergedTags = [];

        if (_tags) {
            mergedTags = mergedTags.concat(_tags);
        }

        if (tags) {
            mergedTags = mergedTags.concat(tags);
        }

        var builder = new MessageBuilder({filters: _filters, useHumanStringForObject: _useHumanStringForObject, reportColumnNumbers: _reportColumnNumbers, innerErrorFieldName: _innerErrorFieldName})
            .setErrorDetails(exception)
            .setRequestDetails(request)
            .setMachineName()
            .setEnvironmentDetails()
            .setUserCustomData(customData)
            .setUser(raygun.user(request) || _user)
            .setVersion(_version)
            .setTags(mergedTags);

        var message = builder.build();

        if (_groupingKey) {
            message.details.groupingKey = typeof _groupingKey === 'function' ? _groupingKey(message, exception, customData, request, tags) : null;
        }

        if (raygun.onBeforeSend) {
            message = typeof _onBeforeSend === 'function' ? _onBeforeSend(message, exception, customData, request, tags) : message;
        }

        var transportMessage = {
            message: message,
            apiKey: _apiKey,
            callback: callback,
            host: _host,
            port: _port,
            useSSL: _useSSL
        };

        if (_isOffline) {
            _offlineStorage.save(transportMessage, callback);
        } else {
            raygunTransport.send(transportMessage);
        }

        return message;
    };

    raygun.expressHandler = function (err, req, res, next) {
        var customData;

        if (typeof raygun.expressCustomData === 'function') {
            customData = raygun.expressCustomData(err, req);
        } else {
            customData = raygun.expressCustomData;
        }

        raygun.send(err, customData || {}, function () {
        }, req);
        next(err);
    };
};

exports.Client = Raygun;
