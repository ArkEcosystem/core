'use strict';

var util = require('util');
var colors = require('./colors');

var $def = {

    // process.stdout:
    log: console.log,
    info: console.info,

    // process.stderr:
    error: console.error,
    warn: console.warn
};

function colorize(value, color, isMsg) {
    value = isMsg && typeof value === 'string' ? value : util.inspect(value);
    return '\x1b[' + color + 'm' + value + '\x1b[0m';
}

function format(stream, values, color) {
    if (stream.isTTY) {
        if (values.length && typeof values[0] === 'string') {
            return [colorize(util.format.apply(null, values), color, true)];
        }
        return Object.keys(values).map(function (key) {
            return colorize(values[key], color);
        });
    }
    return values;
}

/**
 * @class Writer
 * @param noLock
 */
function Writer(noLock) {

    var self = this;

    /**
     * @method Writer.log
     * @description
     * Formats and sends console.log into stdout.
     */
    this.log = function () {
        $def.log.apply(null, format(process.stdout, arguments, getColor(self.log, colors.log)));
    };

    /**
     * @method Writer.error
     * @description
     * Formats and sends console.error into stderr.
     */
    this.error = function () {
        $def.error.apply(null, format(process.stderr, arguments, getColor(self.error, colors.error)));
    };

    /**
     * @method Writer.warn
     * @description
     * Formats and sends console.log into stderr.
     */
    this.warn = function () {
        $def.warn.apply(null, format(process.stderr, arguments, getColor(self.warn, colors.warn)));
    };

    /**
     * @method Writer.info
     * @description
     * Formats and sends console.log into stdout.
     */
    this.info = function () {
        $def.info.apply(null, format(process.stdout, arguments, getColor(self.info, colors.info)));
    };

    /**
     * @method Writer.success
     * @description
     * Formats and sends console.log into stdout.
     *
     * This is a custom method, i.e. doesn't exist on the standard console.
     */
    this.success = function () {
        $def.log.apply(null, format(process.stdout, arguments, getColor(self.success, colors.success)));
    };

    /**
     * @method Writer.ok
     * @description
     * Formats and sends console.log into stdout.
     *
     * This is a custom method, i.e. doesn't exist on the standard console.
     */
    this.ok = function () {
        $def.log.apply(null, format(process.stdout, arguments, getColor(self.ok, colors.ok)));
    };

    /**
     * @method Writer.write
     * @description
     * Formats and sends custom-color values either into stdout or stderr.
     *
     * @param {} values - output parameters
     *
     * @param {number} color - output color: 0 <= color <= 256
     *
     * @param {boolean}[isError=false] - sends console.error into stderr;
     * By default, the method sends console.log into stdout.
     *
     */
    this.write = function (values, color, isError) {
        var method = $def.log, stream = process.stdout;
        if (isError) {
            method = $def.error;
            stream = process.stderr;
        }
        if (color !== +color || color < 0 || color > 256) {
            method.apply(null, values);
        } else {
            method.apply(null, format(stream, values, color));
        }
    };

    addProperties('log');
    addProperties('error');
    addProperties('warn');
    addProperties('info');
    addProperties('success');
    addProperties('ok');

    /**
     * @method Writer.setBright
     * @description
     * Set brightness for all methods at once.
     *
     * @param {boolean} [bright=true]
     * Indicates whether the color is to be set to be bright.
     *
     */
    this.setBright = function (bright) {
        // set to bright colors, if the flag is truthy or undefined;
        // set to dim colors, if flag is falsy
        bright = bright === undefined ? true : !!bright;

        self.log.bright = bright;
        self.error.bright = bright;
        self.warn.bright = bright;
        self.info.bright = bright;
        self.success.bright = bright;
        self.ok.bright = bright;
    };

    if (!noLock) {
        Object.freeze(this);
    }

    function addProperties(name) {

        // brightness for the predefined color:
        Object.defineProperty(self[name], 'bright', {
            value: false,
            writable: true
        });

        // override for the predefined color:
        Object.defineProperty(self[name], 'color', {
            writable: true
        });

        Object.seal(self[name]);
    }
}

function getColor(prop, color) {
    var c = prop.color;
    return (c === +c && c >= 0 && c <= 256) ? c : (prop.bright ? color.bright : color.normal);
}

module.exports = Writer;
