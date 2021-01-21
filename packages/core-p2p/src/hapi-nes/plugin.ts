/* tslint:disable */
"use strict";

import Hoek from "@hapi/hoek";
import Joi from "joi";

import { Listener } from "./listener";

const internals: any = {
    defaults: {
        headers: null,
        payload: {
            maxChunkChars: false,
        },
        heartbeat: {
            interval: 15000, // 15 seconds
            timeout: 5000, // 5 seconds
        },
        maxConnections: false,
    },
};

internals.schema = Joi.object({
    onConnection: Joi.function(), // async function (socket) {}
    onDisconnection: Joi.function(), // function (socket) {}
    onMessage: Joi.function(), // async function (socket, message) { return data; }    // Or throw errors
    headers: Joi.array().items(Joi.string().lowercase()).min(1).allow("*", null),
    payload: {
        maxChunkChars: Joi.number().integer().min(1).allow(false),
    },
    heartbeat: Joi.object({
        interval: Joi.number().integer().min(1).required(),
        timeout: Joi.number().integer().min(1).less(Joi.ref("interval")).required(),
    }).allow(false),
    maxConnections: Joi.number().integer().min(1).allow(false),
    origin: Joi.array().items(Joi.string()).single().min(1),
    maxPayload: Joi.number().integer().min(1),
});

const plugin = {
    pkg: require("../../package.json"),
    requirements: {
        hapi: ">=19.0.0",
    },
    register: function (server, options) {
        const settings: any = Hoek.applyToDefaults(internals.defaults, options);

        if (Array.isArray(settings.headers)) {
            settings.headers = settings.headers.map((field) => field.toLowerCase());
        }

        Joi.assert(settings, internals.schema, "Invalid nes configuration");

        // Create a listener per connection

        const listener = new Listener(server, settings);

        server.ext("onPreStart", () => {
            // Start heartbeats

            listener._beat();

            // Clear stopped state if restarted

            listener._stopped = false;
        });

        // Stop connections when server stops

        server.ext("onPreStop", () => listener._close());

        // Decorate server and request

        server.decorate("request", "socket", internals.socket, { apply: true });
    },
};

export { plugin };

internals.socket = function (request) {
    /* istanbul ignore next */
    return request.plugins.nes ? request.plugins.nes.socket : null;
};
