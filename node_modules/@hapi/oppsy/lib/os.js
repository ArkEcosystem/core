'use strict';

const Os = require('os');

const Utils = require('./utils');


const internals = {};


exports.mem = Utils.resolveNextTick(() => {

    return {
        total: Os.totalmem(),
        free: Os.freemem()
    };
});


exports.loadavg = Utils.resolveNextTick(Os.loadavg);


exports.uptime = Utils.resolveNextTick(Os.uptime);
