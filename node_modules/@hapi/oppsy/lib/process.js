'use strict';

const Hoek = require('@hapi/hoek');

const Utils = require('./utils');


const internals = {};


exports.delay = () => {

    const bench = new Hoek.Bench();

    return new Promise((resolve) => {

        setImmediate(() => {

            return resolve(bench.elapsed());
        });
    });
};


exports.uptime = Utils.resolveNextTick(process.uptime);


exports.memoryUsage = Utils.resolveNextTick(process.memoryUsage);


exports.cpuUsage = Utils.resolveNextTick(process.cpuUsage);
