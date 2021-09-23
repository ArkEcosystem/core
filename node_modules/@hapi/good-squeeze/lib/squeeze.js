'use strict';

const Stream = require('stream');

const Hoek = require('@hapi/hoek');


const internals = {};


module.exports = internals.Squeeze = class extends Stream.Transform {

    constructor(events, options) {

        events = events || {};
        Hoek.assert(typeof events === 'object', 'events must be an object');

        options = Object.assign({}, options, {
            objectMode: true
        });
        super(options);
        this._subscription = internals.Squeeze.subscription(events);
    }

    _transform(data, enc, next) {

        if (internals.Squeeze.filter(this._subscription, data)) {
            return next(null, data);
        }

        next(null);
    }

    static subscription(events) {

        const result = Object.create(null);
        const subs = Object.keys(events);

        for (let i = 0; i < subs.length; ++i) {
            const key = subs[i];
            const filter = events[key];
            const tags = {};

            if (filter && (filter.include || filter.exclude)) {
                tags.include = internals.Squeeze.toTagArray(filter.include);
                tags.exclude = internals.Squeeze.toTagArray(filter.exclude);
            }
            else {
                tags.include = internals.Squeeze.toTagArray(filter);
                tags.exclude = [];
            }

            result[key.toLowerCase()] = tags;
        }

        return result;
    }

    static toTagArray(filter) {

        if (Array.isArray(filter) || (filter && filter !== '*')) {
            const tags = [].concat(filter);

            // Force everything to be a string
            for (let i = 0; i < tags.length; ++i) {
                tags[i] = '' + tags[i];
            }

            return tags;
        }

        return [];
    }

    static filter(subscription, data) {

        const tags = data.tags || [];
        const subEventTags = subscription[data.event];

        // If we aren't interested in this event, break
        if (!subEventTags) {
            return false;
        }

        // If include & exclude is an empty array, we do not want to do any filtering
        if (subEventTags.include.length === 0 && (subEventTags.exclude.length === 0 || tags.length === 0)) {
            return true;
        }

        // Check event tags to see if one of them is in this reports list
        if (Array.isArray(tags)) {
            let result = false;
            for (let i = 0; i < tags.length; ++i) {
                const eventTag = tags[i];
                // As soon as an exclude tag matches, exclude the log entry
                if (subEventTags.exclude.indexOf(eventTag) > -1) {
                    return false;
                }

                result = result || subEventTags.include.indexOf(eventTag) > -1 || subEventTags.include.length === 0;
            }

            return result;
        }

        return false;
    }
};
