'use strict';

const Fs = require('fs');
const Util = require('util');


const internals = {};


exports.stat = Util.promisify(Fs.stat);

exports.readFile = Util.promisify(Fs.readFile);
