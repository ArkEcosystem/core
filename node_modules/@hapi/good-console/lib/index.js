'use strict';

const Stream = require('stream');

const Hoek = require('@hapi/hoek');
const Moment = require('moment');
const SafeStringify = require('json-stringify-safe');


const internals = {
    defaults: {
        format: 'YYMMDD/HHmmss.SSS',
        utc: true,
        color: true
    }
};


module.exports = internals.GoodConsole = class extends Stream.Transform {

    constructor(config) {

        super({ objectMode: true });

        config = config || {};
        this._settings = Hoek.applyToDefaults(internals.defaults, config);
    }

    _transform(data, enc, next) {

        const eventName = data.event;
        let tags = [];

        if (Array.isArray(data.tags)) {
            tags = data.tags.concat([]);
        }
        else if (data.tags) {
            tags = [data.tags];
        }

        tags.unshift(eventName);

        if (eventName === 'error' || data.error instanceof Error) {
            return next(null, internals.formatError(data, tags, this._settings));
        }

        if (eventName === 'ops') {
            return next(null, internals.formatOps(data, tags, this._settings));
        }

        if (eventName === 'response') {
            return next(null, internals.formatResponse(data, tags, this._settings));
        }

        if (!data.data) {
            data.data = '(none)';
        }

        return next(null, internals.formatDefault(data, tags, this._settings));
    }
};


internals.formatOutput = function (event, settings) {

    let timestamp = Moment(parseInt(event.timestamp, 10));

    if (settings.utc) {
        timestamp = timestamp.utc();
    }

    timestamp = timestamp.format(settings.format);

    event.tags = event.tags.toString();
    const tags = ` [${event.tags}] `;

    // Add event id information if available, typically for 'request' events

    const id = event.id ? ` (${event.id})` : '';

    return `${timestamp},${id}${tags}${event.data}\n`;
};


internals.formatMethod = function (method, settings) {

    const methodColors = {
        get: 32,
        delete: 31,
        put: 36,
        post: 33
    };

    let formattedMethod = method.toLowerCase();
    if (settings.color) {
        const color = methodColors[method.toLowerCase()] || 34;
        formattedMethod = `\x1b[1;${color}m${formattedMethod}\x1b[0m`;
    }

    return formattedMethod;
};


internals.formatStatusCode = function (statusCode, settings) {

    let color;
    if (statusCode && settings.color) {
        color = 32;
        if (statusCode >= 500) {
            color = 31;
        }
        else if (statusCode >= 400) {
            color = 33;
        }
        else if (statusCode >= 300) {
            color = 36;
        }

        return `\x1b[${color}m${statusCode}\x1b[0m`;
    }

    return statusCode;
};


internals.formatResponse = function (event, tags, settings) {

    const query = event.query ? SafeStringify(event.query) : '';
    const method = internals.formatMethod(event.method, settings);
    const statusCode = internals.formatStatusCode(event.statusCode, settings) || '';

    // event, timestamp, id, instance, labels, method, path, query, responseTime,
    // statusCode, pid, httpVersion, source, remoteAddress, userAgent, referer, log
    // method, pid, error

    const output = `${event.instance}: ${method} ${event.path} ${query} ${statusCode} (${event.responseTime}ms)`;

    const response = {
        id: event.id,
        timestamp: event.timestamp,
        tags,
        data: output
    };

    return internals.formatOutput(response, settings);
};


internals.formatOps = function (event, tags, settings) {

    const memory = Math.round(event.proc.mem.rss / (1024 * 1024));
    const output = `memory: ${memory}Mb, uptime (seconds): ${event.proc.uptime}, load: [${event.os.load}]`;

    const ops = {
        timestamp: event.timestamp,
        tags,
        data: output
    };

    return internals.formatOutput(ops, settings);
};


internals.formatError = function (event, tags, settings) {

    const output = `message: ${event.error.message}, stack: ${event.error.stack}`;

    const error = {
        id: event.id,
        timestamp: event.timestamp,
        tags,
        data: output
    };

    return internals.formatOutput(error, settings);
};


internals.formatDefault = function (event, tags, settings) {

    const data = typeof event.data === 'object' ? SafeStringify(event.data) : event.data;
    const output = `data: ${data}`;

    const defaults = {
        timestamp: event.timestamp,
        id: event.id,
        tags,
        data: output
    };

    return internals.formatOutput(defaults, settings);
};
