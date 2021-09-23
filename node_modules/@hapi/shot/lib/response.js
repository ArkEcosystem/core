'use strict';

const Http = require('http');
const Stream = require('stream');

const Symbols = require('./symbols');


const internals = {};


exports = module.exports = internals.Response = class extends Http.ServerResponse {

    constructor(req, onEnd) {

        super({ method: req.method, httpVersionMajor: 1, httpVersionMinor: 1 });
        this._shot = { headers: null, trailers: {}, payloadChunks: [] };
        this.assignSocket(internals.nullSocket());

        this.once('finish', () => {

            const res = internals.payload(this);
            res.raw.req = req;
            process.nextTick(() => onEnd(res));
        });
    }

    writeHead(...args) {

        // Find the headers object if one was provided. If a headers object is present, call setHeader()
        // on the first valid header, and then break out of the loop and call writeHead(). By calling
        // setHeader(), Node will materialize a headers object.

        const headers = args[args.length - 1];

        if (typeof headers === 'object' && headers !== null) {
            const headerNames = Object.keys(headers);

            for (let i = 0; i < headerNames.length; ++i) {
                const name = headerNames[i];

                try {
                    this.setHeader(name, headers[name]);
                    break;
                }
                catch (ignoreErr) {} // Let the real writeHead() handle errors.
            }
        }

        const result = super.writeHead(...args);

        this._shot.headers = this.getHeaders();

        // Add raw headers

        ['Date', 'Connection', 'Transfer-Encoding'].forEach((name) => {

            const regex = new RegExp('\\r\\n' + name + ': ([^\\r]*)\\r\\n');
            const field = this._header.match(regex);
            if (field) {
                this._shot.headers[name.toLowerCase()] = field[1];
            }
        });

        return result;
    }

    write(data, encoding, callback) {

        super.write(data, encoding, callback);
        this._shot.payloadChunks.push(Buffer.from(data, encoding));
        return true;                                                    // Write always returns false when disconnected
    }

    end(data, encoding, callback) {

        if (data) {
            this.write(data, encoding);
        }

        super.end(callback);
        this.emit('finish');
    }

    destroy() {

    }

    addTrailers(trailers) {

        for (const key in trailers) {
            this._shot.trailers[key.toLowerCase().trim()] = trailers[key].toString().trim();
        }
    }
};


internals.Response.prototype[Symbols.injection] = true;


internals.payload = function (response) {

    // Prepare response object

    const res = {
        raw: {
            res: response
        },
        headers: response._shot.headers,
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        trailers: {}
    };

    // Prepare payload and trailers

    const rawBuffer = Buffer.concat(response._shot.payloadChunks);
    res.rawPayload = rawBuffer;
    res.payload = rawBuffer.toString();
    res.trailers = response._shot.trailers;

    return res;
};


// Throws away all written data to prevent response from buffering payload

internals.nullSocket = function () {

    return new Stream.Writable({
        write(chunk, encoding, callback) {

            setImmediate(callback);
        }
    });
};
