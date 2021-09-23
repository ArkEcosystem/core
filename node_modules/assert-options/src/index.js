(function (window) {
    'use strict';

    function assertOptions(options, defaults) {
        if (options !== null && options !== undefined && typeof options !== 'object') {
            throw new TypeError('Invalid "options" parameter: ' + JSON.stringify(options));
        }
        const isArray = Array.isArray(defaults);
        if (!isArray && (!defaults || typeof defaults !== 'object')) {
            throw new TypeError('Invalid "defaults" parameter: ' + JSON.stringify(defaults));
        }
        if (options) {
            for (const a in options) {
                if ((isArray && defaults.indexOf(a) === -1) || (!isArray && !(a in defaults))) {
                    throw new Error('Option "' + a + '" is not supported.');
                }
            }
        } else {
            options = {};
        }
        if (!isArray) {
            for (const d in defaults) {
                if (options[d] === undefined && defaults[d] !== undefined) {
                    options[d] = defaults[d];
                }
            }
        }
        return options;
    }

    /* istanbul ignore else */
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = assertOptions;
    } else {
        window.assertOptions = assertOptions;
    }
})(this);
