'use strict';

const Events = require('events');
const Os = require('os');

const Hoek = require('@hapi/hoek');

const NetworkMonitor = require('./network');
const OsMonitor = require('./os');
const ProcessMonitor = require('./process');


module.exports = class extends Events.EventEmitter {

    constructor(server, config) {

        super();
        config = config || {};
        this._networkMonitor = new NetworkMonitor(server, config.httpAgents, config.httpsAgents);
        this._tasks = {
            osload: OsMonitor.loadavg,
            osmem: OsMonitor.mem,
            osup: OsMonitor.uptime,
            psup: ProcessMonitor.uptime,
            psmem: ProcessMonitor.memoryUsage,
            pscpu: ProcessMonitor.cpuUsage,
            psdelay: ProcessMonitor.delay,
            requests: this._networkMonitor.requests,
            responseTimes: this._networkMonitor.responseTimes,
            sockets: this._networkMonitor.sockets
        };
    }

    start(interval) {

        Hoek.assert(interval <= 2147483647, 'interval must be less than 2147483648');
        const host = Os.hostname();

        const handler = async () => {

            const tasks = [];
            for (const taskName in this._tasks) {
                tasks.push(this._tasks[taskName]());
            }

            try {
                const results = await Promise.all(tasks);

                const emit = {
                    host
                };

                for (const taskName in this._tasks) {
                    emit[taskName] = results.shift();
                }

                this.emit('ops', emit);
            }
            catch (err) {
                this.emit('error', err);
            }
            finally {
                this._networkMonitor.reset();
            }
        };

        this._interval = setInterval(handler, interval);
    }

    stop() {

        clearInterval(this._interval);
        this._networkMonitor.reset();
        this.emit('stop');
    }
};
