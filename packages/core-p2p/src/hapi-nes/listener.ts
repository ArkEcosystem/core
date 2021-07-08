"use strict";

import Hoek from "@hapi/hoek";
import Ws from "ws";

import { Socket } from "./socket";

const internals = {
    counter: {
        min: 10000,
        max: 99999,
    },
};

export class Listener {
    public _stopped;

    private _server;
    private _settings;
    private _sockets;
    private _socketCounter;
    private _heartbeat;
    private _beatTimeout;
    private _wss;

    public constructor(server, settings) {
        this._server = server;
        this._settings = settings;
        this._sockets = new Sockets(this);
        this._socketCounter = internals.counter.min;
        this._heartbeat = null;
        this._beatTimeout = null;
        this._stopped = false;

        // WebSocket listener

        const options: any = { server: this._server.listener, maxPayload: settings.maxPayload, perMessageDeflate: false };
        if (settings.origin) {
            options.verifyClient = (info) => settings.origin.indexOf(info.origin) >= 0;
        }

        this._wss = new Ws.Server(options);

        this._wss.on("connection", (ws, req) => {
            ws.on("error", Hoek.ignore);

            if (
                this._stopped ||
                (this._settings.maxConnections && this._sockets.length() >= this._settings.maxConnections)
            ) {
                return ws.close();
            }

            this._add(ws, req);
        });

        this._wss.on("error", Hoek.ignore);

        // Register with the server

        this._server.plugins.nes = { _listener: this };
    }

    public async _close() {
        this._stopped = true;
        clearTimeout(this._heartbeat);
        clearTimeout(this._beatTimeout);

        await Promise.all(Object.keys(this._sockets._items).map((id) => this._sockets._items[id].disconnect()));

        this._wss.close();
    }

    public _beat() {
        if (!this._settings.heartbeat) {
            return;
        }

        if (
            this._heartbeat && // Skip the first time
            this._sockets.length()
        ) {
            // Send heartbeats

            const update = {
                type: "ping",
            };

            this._sockets._forEach((socket: Socket) => socket._send(update).catch(Hoek.ignore)); // Ignore errors

            // Verify client responded

            this._beatTimeout = setTimeout(() => {
                this._sockets._forEach((socket: Socket) => {
                    if (!socket._active()) {
                        socket.disconnect();
                        return;
                    }

                    socket._pinged = false;
                });
            }, this._settings.heartbeat.timeout);
        }

        // Schedule next heartbeat

        this._heartbeat = setTimeout(() => {
            this._beat();
        }, this._settings.heartbeat.interval);
    }

    public _generateId() {
        const id = Date.now() + ":" + this._server.info.id + ":" + this._socketCounter++;
        if (this._socketCounter > internals.counter.max) {
            this._socketCounter = internals.counter.min;
        }

        return id;
    }

    private _add(ws, req) {
        // Socket object

        const socket = new Socket(ws, req, this);

        this._sockets.add(socket);

        ws.once("close", async (code, message) => {
            this._sockets.remove(socket);

            if (this._settings.onDisconnection) {
                this._settings.onDisconnection(socket);
            }

            socket._removed.attend();
        });
    }
}

// Sockets manager

class Sockets {
    private _items;

    public constructor(listener) {
        this._items = {};
    }

    public add(socket) {
        this._items[socket.id] = socket;
    }

    public remove(socket) {
        delete this._items[socket.id];
    }

    public length() {
        return Object.keys(this._items).length;
    }

    public async _forEach(each) {
        for (const item in this._items) {
            await each(this._items[item]);
        }
    }
}
