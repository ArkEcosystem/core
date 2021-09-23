'use strict';

const internals = {};


exports.resolveNextTick = (predicate) => {

    return () => {

        return new Promise((resolve) => {

            process.nextTick((result) => resolve(result), predicate());
        });
    };
};


exports.timeout = (ms) => {

    return new Promise((resolve) => setTimeout(resolve, ms));
};
