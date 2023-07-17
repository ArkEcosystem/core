"use strict";

/*
    (hapi)nes WebSocket Client (https://github.com/hapijs/nes)
    Copyright (c) 2015-2016, Eran Hammer <eran@hammer.io> and other contributors
    BSD Licensed
*/

import WebSocket from "ws";
import { parseNesMessage, stringifyNesMessage } from "./utils";

/* eslint no-undef: 0 */
const version = "2";
const ignore = function () {};

const nextTick = function (callback) {
    return (err) => {
        setTimeout(() => callback(err), 0);
    };
};

// NesError types

const errorTypes = {
    TIMEOUT: "timeout",
    DISCONNECT: "disconnect",
    SERVER: "server",
    PROTOCOL: "protocol",
    WS: "ws",
    USER: "user",
};

const NesError = function (err, type) {
    if (typeof err === "string") {
        err = new Error(err);
    }

    err.type = type;
    err.isNes = true;

    try {
        throw err; // ensure stack trace for IE11
    } catch (withStack) {
        return withStack;
    }
};

// Error codes

const errorCodes = {
    1000: "Normal closure",
    1001: "Going away",
    1002: "Protocol error",
    1003: "Unsupported data",
    1004: "Reserved",
    1005: "No status received",
    1006: "Abnormal closure",
    1007: "Invalid frame payload data",
    1008: "Policy violation",
    1009: "Message too big",
    1010: "Mandatory extension",
    1011: "Internal server error",
    1015: "TLS handshake",
};

const DEFAULT_MAX_PAYLOAD_CLIENT = 100 * 1024;

// Client

export class Client {
    public onError;
    public onConnect;
    public onDisconnect;
    public onHeartbeatTimeout;

    public id;

    private _url;
    private _settings;
    private _heartbeatTimeout;
    private _ws;
    private _reconnection;
    private _reconnectionTimer;
    private _ids;
    private _requests;
    private _heartbeat;
    private _disconnectListeners;
    private _disconnectRequested;
    private _lastPinged;

    public constructor(url, options?) {
        options = options || {};

        options.ws = options.ws || {};

        options.ws = {
            maxPayload: DEFAULT_MAX_PAYLOAD_CLIENT,
            ...options.ws,
            perMessageDeflate: false
        }

        // Configuration
        this._url = url;
        this._settings = options;
        this._heartbeatTimeout = false; // Server heartbeat configuration

        // State

        this._ws = null;
        this._reconnection = null;
        this._reconnectionTimer = null;
        this._ids = 0; // Id counter
        this._requests = {}; // id -> { resolve, reject, timeout }
        this._heartbeat = null;
        this._disconnectListeners = null;
        this._disconnectRequested = false;

        // Events

        this.onError = (err) => console.error(err); // General error handler (only when an error cannot be associated with a request)
        this.onConnect = ignore; // Called whenever a connection is established
        this.onDisconnect = ignore; // Called whenever a connection is lost: function(willReconnect)
        this.onHeartbeatTimeout = ignore; // Called when a heartbeat timeout will cause a disconnection

        // Public properties

        this.id = null; // Assigned when hello response is received
    }

    public connect(options?) {
        options = options || {};

        if (this._reconnection) {
            return Promise.reject(NesError("Cannot connect while client attempts to reconnect", errorTypes.USER));
        }

        if (this._ws) {
            return Promise.reject(NesError("Already connected", errorTypes.USER));
        }

        if (options.reconnect !== false) {
            // Defaults to true
            this._reconnection = {
                // Options: reconnect, delay, maxDelay
                wait: 0,
                delay: options.delay || 1000, // 1 second
                maxDelay: options.maxDelay || 5000, // 5 seconds
                retries: options.retries || Infinity, // Unlimited
                settings: {
                    auth: options.auth,
                    timeout: options.timeout,
                },
            };
        } else {
            this._reconnection = null;
        }

        return new Promise<void>((resolve, reject) => {
            this._connect(options, true, (err) => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    }

    public disconnect() {
        return new Promise((resolve) => this._disconnect(resolve, false));
    }

    public terminate() {
        return new Promise((resolve) => this._disconnect(resolve, false, true));
    }

    public request(options) {
        if (typeof options === "string") {
            options = {
                path: options,
            };
        }

        const request = {
            type: "request",
            method: "POST",
            path: options.path,
            headers: options.headers,
            payload: options.payload,
        };

        return this._send(request, true);
    }

    public _isReady() {
        return this._ws && this._ws.readyState === WebSocket.OPEN;
    }

    public setMaxPayload(maxPayload: number) {
        if (this._ws?._receiver) {
            this._ws._receiver._maxPayload = maxPayload;
        }
    }

    public setTimeout(timeout: number) {
        this._settings.timeout = timeout;
    }

    private _connect(options, initial, next) {
        const ws = new WebSocket(this._url, this._settings.ws);
        this._ws = ws;

        clearTimeout(this._reconnectionTimer);
        this._reconnectionTimer = null;

        const reconnect = (event) => {
            if (ws.onopen) {
                finalize(NesError("Connection terminated while waiting to connect", errorTypes.WS));
            }

            const wasRequested = this._disconnectRequested; // Get value before _cleanup()

            this._cleanup();

            const log = {
                code: event.code,
                explanation: errorCodes[event.code] || "Unknown",
                reason: event.reason,
                wasClean: event.wasClean,
                willReconnect: this._willReconnect(),
                wasRequested,
            };

            this.onDisconnect(log.willReconnect, log);
            this._reconnect();
        };

        const finalize = (err) => {
            if (next) {
                // Call only once when connect() is called
                const nextHolder = next;
                next = null;
                return nextHolder(err);
            }

            return this.onError(err);
        };

        const timeoutHandler = () => {
            this._cleanup();

            finalize(NesError("Connection timed out", errorTypes.TIMEOUT));

            if (initial) {
                return this._reconnect();
            }
        };

        const timeout = options.timeout ? setTimeout(timeoutHandler, options.timeout) : null;

        ws.onopen = () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            ws.onopen = null;

            this._hello(options.auth)
                .then(() => {
                    this.onConnect();
                    finalize(undefined);
                })
                .catch((err) => {
                    this._disconnect(() => nextTick(finalize)(err), true); // Stop reconnection when the hello message returns error
                });
        };

        ws.onerror = (event) => {
            /* istanbul ignore next */
            if (timeout) {
                clearTimeout(timeout);
            }

            if (this._willReconnect()) {
                return reconnect(event);
            }

            this._cleanup();
            const error = NesError("Socket error", errorTypes.WS);
            return finalize(error);
        };

        ws.onclose = reconnect;

        ws.onmessage = (message) => {
            return this._onMessage(message);
        };

        ws.on("ping", () => this._disconnect(() => {}, true, true));
        ws.on("pong", () => this._disconnect(() => {}, true, true));
    }

    private _disconnect(next, isInternal, terminate = false) {
        this._reconnection = null;
        clearTimeout(this._reconnectionTimer);
        this._reconnectionTimer = null;
        const requested = this._disconnectRequested || !isInternal; // Retain true

        if (this._disconnectListeners) {
            this._disconnectRequested = requested;
            this._disconnectListeners.push(next);
            return;
        }

        if (!this._ws || (this._ws.readyState !== WebSocket.OPEN && this._ws.readyState !== WebSocket.CONNECTING)) {
            return next();
        }

        this._disconnectRequested = requested;
        this._disconnectListeners = [next];

        if (terminate) {
            this._ws.terminate();
        } else {
            this._ws.close();
        }
    }

    private _cleanup() {
        if (this._ws) {
            const ws = this._ws;
            this._ws = null;

            if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
                ws.close();
            }

            ws.onopen = null;
            ws.onclose = null;
            ws.onerror = ignore;
            ws.onmessage = null;
        }

        this.id = null;

        clearTimeout(this._heartbeat);
        this._heartbeat = null;

        // Flush pending requests

        const error = NesError("Request failed - server disconnected", errorTypes.DISCONNECT);

        const requests = this._requests;
        this._requests = {};
        const ids = Object.keys(requests);
        for (let i = 0; i < ids.length; ++i) {
            const id = ids[i];
            const request = requests[id];
            clearTimeout(request.timeout);
            request.reject(error);
        }

        if (this._disconnectListeners) {
            const listeners = this._disconnectListeners;
            this._disconnectListeners = null;
            this._disconnectRequested = false;
            listeners.forEach((listener) => listener());
        }
    }

    private _reconnect() {
        // Reconnect

        const reconnection = this._reconnection;
        if (!reconnection) {
            return;
        }

        if (reconnection.retries < 1) {
            return this._disconnect(ignore, true); // Clear _reconnection state
        }

        --reconnection.retries;
        reconnection.wait = reconnection.wait + reconnection.delay;

        const timeout = Math.min(reconnection.wait, reconnection.maxDelay);

        this._reconnectionTimer = setTimeout(() => {
            this._connect(reconnection.settings, false, (err) => {
                if (err) {
                    this.onError(err);
                    return this._reconnect();
                }
            });
        }, timeout);
    }

    private _send(request, track) {
        if (!this._isReady()) {
            return Promise.reject(NesError("Failed to send message - server disconnected", errorTypes.DISCONNECT));
        }

        request.id = ++this._ids;

        let encoded;
        try {
            encoded = stringifyNesMessage(request);
        } catch (err) {
            return Promise.reject(err);
        }

        // Ignore errors

        if (!track) {
            try {
                this._ws.send(encoded);
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(NesError(err, errorTypes.WS));
            }
        }

        // Track errors

        const record: { resolve: any; reject: any; timeout: any } = {
            resolve: null,
            reject: null,
            timeout: null,
        };

        const promise = new Promise((resolve, reject) => {
            record.resolve = resolve;
            record.reject = reject;
        });

        /* istanbul ignore next */
        if (this._settings.timeout) {
            record.timeout = setTimeout(() => {
                record.timeout = null;
                delete this._requests[request.id];
                return record.reject(NesError("Request timed out", errorTypes.TIMEOUT));
            }, this._settings.timeout);
        }

        this._requests[request.id] = record;

        try {
            this._ws.send(encoded);
        } catch (err) {
            clearTimeout(this._requests[request.id].timeout);
            delete this._requests[request.id];
            return Promise.reject(NesError(err, errorTypes.WS));
        }

        return promise;
    }

    private _hello(auth) {
        const request: any = {
            type: "hello",
            version,
        };

        return this._send(request, true);
    }

    private _resetMaxPayload() {
        this.setMaxPayload(this._settings.ws.maxPayload);
    }

    private _onMessage(message) {
        this._beat();

        let update;
        try {
            if (!(message.data instanceof Buffer)) {
                return this.onError(NesError("Received message is not a Buffer", errorTypes.PROTOCOL));
            }
            update = parseNesMessage(message.data);
        } catch (err) {
            return this.onError(NesError(err, errorTypes.PROTOCOL));
        }

        // Recreate error

        let error: any = null;
        if (update.statusCode && update.statusCode >= 400) {
            /* istanbul ignore next */
            update.payload =
                update.payload instanceof Buffer
                    ? (update.payload as Buffer).slice(0, 512).toString() // slicing to reduce possible intensive toString() call
                    : "Error";
            error = NesError(update.payload, errorTypes.SERVER);
            error.statusCode = update.statusCode;
            error.data = update.payload;
            error.headers = update.headers;
            error.path = update.path;
        }

        // Ping

        if (update.type === "ping") {
            if (this._lastPinged && Date.now() < this._lastPinged + 1000) {
                this._lastPinged = Date.now();
                return this.onError(NesError("Ping exceeded limit", errorTypes.PROTOCOL));
            }
            this._lastPinged = Date.now();
            return this._send({ type: "ping" }, false).catch(ignore); // Ignore errors
        }

        this._resetMaxPayload();

        // Lookup request (message must include an id from this point)
        const request = this._requests[update.id];
        if (!request) {
            return this.onError(NesError("Received response for unknown request", errorTypes.PROTOCOL));
        }

        clearTimeout(request.timeout);
        delete this._requests[update.id];

        const next = (err, args?) => {
            if (err) {
                return request.reject(err);
            }

            return request.resolve(args);
        };

        // Response

        if (update.type === "request") {
            return next(error, { payload: update.payload, statusCode: update.statusCode, headers: update.headers });
        }

        // Authentication

        if (update.type === "hello") {
            this.id = update.socket;
            if (update.heartbeat) {
                this._heartbeatTimeout = update.heartbeat.interval + update.heartbeat.timeout;
                if (this._heartbeatTimeout === 0) {
                    this._heartbeatTimeout = false;
                }
                this._beat(); // Call again once timeout is set
            }

            return next(error);
        }

        next(NesError("Received invalid response", errorTypes.PROTOCOL));
        return this.onError(NesError("Received unknown response type: " + update.type, errorTypes.PROTOCOL));
    }

    private _beat() {
        if (!this._heartbeatTimeout) {
            return;
        }

        clearTimeout(this._heartbeat);

        this._heartbeat = setTimeout(() => {
            this.onError(NesError("Disconnecting due to heartbeat timeout", errorTypes.TIMEOUT));
            this.onHeartbeatTimeout(this._willReconnect());
            this._ws.close();
        }, this._heartbeatTimeout);
    }

    private _willReconnect() {
        return !!(this._reconnection && this._reconnection.retries >= 1);
    }
}
