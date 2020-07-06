"use strict";

/*
    (hapi)nes WebSocket Client (https://github.com/hapijs/nes)
    Copyright (c) 2015-2016, Eran Hammer <eran@hammer.io> and other contributors
    BSD Licensed
*/

import WebSocket from "ws";

/* eslint no-undef: 0 */
const version = "2";
const ignore = function () {};

const stringify = function (message) {
    try {
        return JSON.stringify(message);
    } catch (err) {
        throw NesError(err, errorTypes.USER);
    }
};

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

// Client

export class Client {
    public onError;
    public onConnect;
    public onDisconnect;
    public onHeartbeatTimeout;
    public onUpdate;

    public id;

    private _isBrowser;
    private _url;
    private _settings;
    private _heartbeatTimeout;
    private _ws;
    private _reconnection;
    private _reconnectionTimer;
    private _ids;
    private _requests;
    // private _subscriptions;
    private _heartbeat;
    private _packets;
    private _disconnectListeners;
    private _disconnectRequested;

    public constructor(url, options?) {
        options = options || {};

        this._isBrowser = false;

        if (!this._isBrowser) {
            options.ws = options.ws || {};

            if (options.ws.maxPayload === undefined) {
                options.ws.maxPayload = 0; // Override default 100Mb limit in ws module to avoid breaking change
            }
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
        //this._subscriptions = {}; // path -> [callbacks]
        this._heartbeat = null;
        this._packets = [];
        this._disconnectListeners = null;
        this._disconnectRequested = false;

        // Events

        this.onError = (err) => console.error(err); // General error handler (only when an error cannot be associated with a request)
        this.onConnect = ignore; // Called whenever a connection is established
        this.onDisconnect = ignore; // Called whenever a connection is lost: function(willReconnect)
        this.onHeartbeatTimeout = ignore; // Called when a heartbeat timeout will cause a disconnection
        this.onUpdate = ignore;

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

        return new Promise((resolve, reject) => {
            this._connect(options, true, (err) => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    }

    public overrideReconnectionAuth(auth) {
        if (!this._reconnection) {
            return false;
        }

        this._reconnection.settings.auth = auth;
        return true;
    }

    public reauthenticate(auth) {
        this.overrideReconnectionAuth(auth);

        const request = {
            type: "reauth",
            auth,
        };

        return this._send(request, true);
    }

    public disconnect() {
        return new Promise((resolve) => this._disconnect(resolve, false));
    }

    public request(options) {
        if (typeof options === "string") {
            options = {
                method: "GET",
                path: options,
            };
        }

        const request = {
            type: "request",
            method: options.method || "GET",
            path: options.path,
            headers: options.headers,
            payload: options.payload,
        };

        return this._send(request, true);
    }

    public message(message) {
        const request = {
            type: "message",
            message,
        };

        return this._send(request, true);
    }

    public _isReady() {
        return this._ws && this._ws.readyState === WebSocket.OPEN;
    }

    // public subscriptions() {
    //     return Object.keys(this._subscriptions);
    // }

    // public subscribe(path, handler) {
    //     if (!path || path[0] !== "/") {
    //         return Promise.reject(NesError("Invalid path", errorTypes.USER));
    //     }

    //     const subs = this._subscriptions[path];
    //     if (subs) {
    //         // Already subscribed

    //         if (subs.indexOf(handler) === -1) {
    //             subs.push(handler);
    //         }

    //         return Promise.resolve();
    //     }

    //     this._subscriptions[path] = [handler];

    //     if (!this._isReady()) {
    //         // Queued subscription

    //         return Promise.resolve();
    //     }

    //     const request = {
    //         type: "sub",
    //         path,
    //     };

    //     const promise = this._send(request, true);
    //     promise.catch((ignoreErr) => {
    //         delete this._subscriptions[path];
    //     });

    //     return promise;
    // }

    // public unsubscribe(path, handler) {
    //     if (!path || path[0] !== "/") {
    //         return Promise.reject(NesError("Invalid path", errorTypes.USER));
    //     }

    //     const subs = this._subscriptions[path];
    //     if (!subs) {
    //         return Promise.resolve();
    //     }

    //     let sync = false;
    //     if (!handler) {
    //         delete this._subscriptions[path];
    //         sync = true;
    //     } else {
    //         const pos = subs.indexOf(handler);
    //         if (pos === -1) {
    //             return Promise.resolve();
    //         }

    //         subs.splice(pos, 1);
    //         if (!subs.length) {
    //             delete this._subscriptions[path];
    //             sync = true;
    //         }
    //     }

    //     if (!sync || !this._isReady()) {
    //         return Promise.resolve();
    //     }

    //     const request = {
    //         type: "unsub",
    //         path,
    //     };

    //     const promise = this._send(request, true);
    //     promise.catch(ignore); // Ignoring errors as the subscription handlers are already removed
    //     return promise;
    // }

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
                    // if (err.path) {
                    //     delete this._subscriptions[err.path];
                    // }

                    this._disconnect(() => nextTick(finalize)(err), true); // Stop reconnection when the hello message returns error
                });
        };

        ws.onerror = (event) => {
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
    }

    private _disconnect(next, isInternal) {
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
        this._ws.close();
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

        this._packets = [];
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
            encoded = stringify(request);
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

        if (this._settings.timeout) {
            record.timeout = setTimeout(() => {
                record.timeout = null;
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

        if (auth) {
            request.auth = auth;
        }

        // const subs = this.subscriptions();
        // if (subs.length) {
        //     request.subs = subs;
        // }

        return this._send(request, true);
    }

    private _onMessage(message) {
        this._beat();

        let data = message.data;
        const prefix = data[0];
        if (prefix !== "{") {
            this._packets.push(data.slice(1));
            if (prefix !== "!") {
                return;
            }

            data = this._packets.join("");
            this._packets = [];
        }

        if (this._packets.length) {
            this._packets = [];
            this.onError(NesError("Received an incomplete message", errorTypes.PROTOCOL));
        }

        let update;
        try {
            update = JSON.parse(data);
        } catch (err) {
            return this.onError(NesError(err, errorTypes.PROTOCOL));
        }

        // Recreate error

        let error: any = null;
        if (update.statusCode && update.statusCode >= 400) {
            error = NesError(update.payload.message || update.payload.error || "Error", errorTypes.SERVER);
            error.statusCode = update.statusCode;
            error.data = update.payload;
            error.headers = update.headers;
            error.path = update.path;
        }

        // Ping

        if (update.type === "ping") {
            return this._send({ type: "ping" }, false).catch(ignore); // Ignore errors
        }

        // Broadcast and update

        if (update.type === "update") {
            return this.onUpdate(update.message);
        }

        // Publish or Revoke

        // if (update.type === "pub" || update.type === "revoke") {
        //     const handlers = this._subscriptions[update.path];
        //     if (update.type === "revoke") {
        //         delete this._subscriptions[update.path];
        //     }

        //     if (handlers && update.message !== undefined) {
        //         const flags: any = {};
        //         if (update.type === "revoke") {
        //             flags.revoked = true;
        //         }

        //         for (let i = 0; i < handlers.length; ++i) {
        //             handlers[i](update.message, flags);
        //         }
        //     }

        //     return;
        // }

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

        // Custom message

        if (update.type === "message") {
            return next(error, { payload: update.message });
        }

        // Authentication

        if (update.type === "hello") {
            this.id = update.socket;
            if (update.heartbeat) {
                this._heartbeatTimeout = update.heartbeat.interval + update.heartbeat.timeout;
                this._beat(); // Call again once timeout is set
            }

            return next(error);
        }

        if (update.type === "reauth") {
            return next(error, true);
        }

        // Subscriptions

        // if (update.type === "sub" || update.type === "unsub") {
        //     return next(error);
        // }

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
