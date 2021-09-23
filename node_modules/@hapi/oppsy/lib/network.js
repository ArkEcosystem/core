'use strict';

const Http = require('http');
const Https = require('https');

const Hoek = require('@hapi/hoek');


const internals = {};


module.exports = internals.Network = class {

    constructor(server, httpAgents, httpsAgents) {

        this._requests = {};
        this._responseTimes = {};
        this._server = server;
        this._httpAgents = [].concat(httpAgents || Http.globalAgent);
        this._httpsAgents = [].concat(httpsAgents || Https.globalAgent);

        this._server.ext('onRequest', (request, h) => {

            const port = this._server.info.port;

            this._requests[port] = this._requests[port] || {
                total: 0,
                disconnects: 0,
                statusCodes: {}
            };
            this._requests[port].total++;

            request.events.once('disconnect', () => {

                this._requests[port].disconnects++;
            });

            return h.continue;
        });
        this._server.events.on('response', (request) => {

            const msec = Date.now() - request.info.received;
            const port = this._server.info.port;
            const statusCode = request.response && request.response.statusCode;

            const portResponse = this._responseTimes[port] = (this._responseTimes[port] || {
                count: 0,
                total: 0,
                max: 0
            });
            portResponse.count++;
            portResponse.total += msec;

            if (portResponse.max < msec) {
                portResponse.max = msec;
            }

            if (statusCode) {
                this._requests[port].statusCodes[statusCode] = this._requests[port].statusCodes[statusCode] || 0;
                this._requests[port].statusCodes[statusCode]++;
            }
        });

        this.requests = () => {

            return this._requests;
        };

        this.responseTimes = () => {

            const ports = Object.keys(this._responseTimes);
            const overview = {};
            for (let i = 0; i < ports.length; ++i) {
                const port = ports[i];
                const count = Hoek.reach(this, `_responseTimes.${port}.count`, {
                    default: 1
                });
                overview[port] = {
                    avg: this._responseTimes[port].total / count,
                    max: this._responseTimes[port].max
                };
            }

            return overview;
        };

        this.sockets = () => {

            return {
                http: internals.Network.getSocketCount(this._httpAgents),
                https: internals.Network.getSocketCount(this._httpsAgents)
            };
        };

        this.reset = () => {

            const ports = Object.keys(this._requests);
            for (let i = 0; i < ports.length; ++i) {
                this._requests[ports[i]] = {
                    total: 0,
                    disconnects: 0,
                    statusCodes: {}
                };
                this._responseTimes[ports[i]] = {
                    count: 0,
                    total: 0,
                    max: 0
                };
            }
        };
    }

    static getSocketCount(agents) {

        const result = {
            total: 0
        };

        for (let i = 0; i < agents.length; ++i) {
            const agent = agents[i];

            const keys = Object.keys(agent.sockets);
            for (let j = 0; j < keys.length; ++j) {
                const key = keys[j];
                result[key] = agent.sockets[key].length;
                result.total += result[key];
            }
        }

        return result;
    }
};
