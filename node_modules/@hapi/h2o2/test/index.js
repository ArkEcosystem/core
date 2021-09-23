'use strict';

const Fs = require('fs');
const Http = require('http');
const Net = require('net');
const Zlib = require('zlib');

const Boom = require('@hapi/boom');
const Code = require('@hapi/code');
const H2o2 = require('..');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Inert = require('@hapi/inert');
const Lab = require('@hapi/lab');
const Wreck = require('@hapi/wreck');


const internals = {};


const { it, describe } = exports.lab = Lab.script();
const expect = Code.expect;


describe('h2o2', () => {

    const tlsOptions = {
        key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEA3IDFzxorKO8xWeCOosuK1pCPoTUMlhOkis4pWO9CLCv0o0Q7\nyUCZlHzPYWM49+QmWe5u3Xbl1rhkFsoeYowH1bts5r6HY8xYHexvU+6zEyxOU4Q7\nP7EXkFfW5h7WsO6uaEyEBVdniTIjK4c8hzjy7h6hNIvM+kEAAy1UFatMKmOwsp4Z\ns4+oCmS4ZPlItAMbRv/4a5DCopluOS7WN8UwwJ6zRrY8ZVFnkKPThflnwiaIy2Qh\nGgTwLANIUlWPQMh+LLHnV56NOlj1VUO03G+pKxTJ6ZkfYefaD41Ez4iPc7nyg4iD\njqnqFX+jYOLRoCktztYd9T43Sgb2sfgrlY0ENwIDAQABAoIBAQCoznyg/CumfteN\nMvh/cMutT6Zlh7NHAWqqSQImb6R9JHl4tDgA7k+k+ZfZuphWTnd9yadeLDPwmeEm\nAT4Zu5IT8hSA4cPMhxe+cM8ZtlepifW8wjKJpA2iF10RdvJtKYyjlFBNtogw5A1A\nuZuA+fwgh5pqG8ykmTZlOEJzBFye5Z7xKc/gwy9BGv3RLNVf+yaJCqPKLltkAxtu\nFmrBLuIZMoOJvT+btgVxHb/nRVzURKv5iKMY6t3JM84OSxNn0/tHpX2xTcqsVre+\nsdSokKGYoyzk/9miDYhoSVOrM3bU5/ygBDt1Pmf/iyK/MDO2P9tX9cEp/+enJc7a\nLg5O/XCBAoGBAPNwayF6DLu0PKErsdCG5dwGrxhC69+NBEJkVDMPMjSHXAQWneuy\n70H+t2QHxpDbi5wMze0ZClMlgs1wItm4/6iuvOn9HJczwiIG5yM9ZJo+OFIqlBq3\n1vQG+oEXe5VpTfpyQihxqTSiMuCXkTYtNjneHseXWAjFuUQe9AOxxzNRAoGBAOfh\nZEEDY7I1Ppuz7bG1D6lmzYOTZZFfMCVGGTrYmam02+rS8NC+MT0wRFCblQ0E7SzM\nr9Bv2vbjrLY5fCe/yscF+/u/UHJu1dR7j62htdYeSi7XbQiSwyUm1QkMXjKDQPUw\njwR3WO8ZHQf2tywE+7iRs/bJ++Oolaw03HoIp40HAoGBAJJwGpGduJElH5+YCDO3\nIghUIPnIL9lfG6PQdHHufzXoAusWq9J/5brePXU31DOJTZcGgM1SVcqkcuWfwecU\niP3wdwWOU6eE5A/R9TJWmPDL4tdSc5sK4YwTspb7CEVdfiHcn31yueVGeLJvmlNr\nqQXwXrWTjcphHkwjDog2ZeyxAoGBAJ5Yyq+i8uf1eEW3v3AFZyaVr25Ur51wVV5+\n2ifXVkgP28YmOpEx8EoKtfwd4tE7NgPL25wJZowGuiDObLxwOrdinMszwGoEyj0K\nC/nUXmpT0PDf5/Nc1ap/NCezrHfuLePCP0gbgD329l5D2p5S4NsPlMfI8xxqOZuZ\nlZ44XsLtAoGADiM3cnCZ6x6/e5UQGfXa6xN7KoAkjjyO+0gu2AF0U0jDFemu1BNQ\nCRpe9zVX9AJ9XEefNUGfOI4bhRR60RTJ0lB5Aeu1xAT/OId0VTu1wRrbcnwMHGOo\nf7Kk1Vk5+1T7f1QbTu/q4ddp22PEt2oGJ7widRTZrr/gtH2wYUEjMVQ=\n-----END RSA PRIVATE KEY-----\n',
        cert: '-----BEGIN CERTIFICATE-----\nMIIC+zCCAeOgAwIBAgIJANnDRcmEqJssMA0GCSqGSIb3DQEBBQUAMBQxEjAQBgNV\nBAMMCWxvY2FsaG9zdDAeFw0xNzA5MTIyMjMxMDRaFw0yNzA5MTAyMjMxMDRaMBQx\nEjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\nggEBANyAxc8aKyjvMVngjqLLitaQj6E1DJYTpIrOKVjvQiwr9KNEO8lAmZR8z2Fj\nOPfkJlnubt125da4ZBbKHmKMB9W7bOa+h2PMWB3sb1PusxMsTlOEOz+xF5BX1uYe\n1rDurmhMhAVXZ4kyIyuHPIc48u4eoTSLzPpBAAMtVBWrTCpjsLKeGbOPqApkuGT5\nSLQDG0b/+GuQwqKZbjku1jfFMMCes0a2PGVRZ5Cj04X5Z8ImiMtkIRoE8CwDSFJV\nj0DIfiyx51eejTpY9VVDtNxvqSsUyemZH2Hn2g+NRM+Ij3O58oOIg46p6hV/o2Di\n0aApLc7WHfU+N0oG9rH4K5WNBDcCAwEAAaNQME4wHQYDVR0OBBYEFJBSho+nF530\nsxpoBxYqD/ynn/t0MB8GA1UdIwQYMBaAFJBSho+nF530sxpoBxYqD/ynn/t0MAwG\nA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEFBQADggEBAJFAh3X5CYFAl0cI6Q7Vcp4H\nO0S8s/C4FHNIsyUu54NcRH3taUwn3Fshn5LiwaEdFmouALbxMaejvEVw7hVBtY9X\nOjqt0mZ6+X6GOFhoUvlaG1c7YLOk5x51TXchg8YD2wxNXS0rOrAdZaScOsy8Q62S\nHehBJMN19JK8TiR3XXzxKVNcFcg0wyQvCGgjrHReaUF8WePfWHtZDdP01kBmMEIo\n6wY7E3jFqvDUs33vTOB5kmWixIoJKmkgOVmbgchmu7z27n3J+fawNr2r4IwjdUpK\nc1KvFYBXLiT+2UVkOJbBZ3C8mKfhXKHs2CrI3cSa4+E0sxTy4joG/yzlRs5l954=\n-----END CERTIFICATE-----\n'
    };

    it('overrides maxSockets', { parallel: false }, async () => {

        let maxSockets;
        const httpClient = {
            request(method, uri, options, callback) {

                maxSockets = options.agent.maxSockets;

                return { statusCode: 200 };
            }
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', httpClient, maxSockets: 213 } } });
        await server.inject('/');
        expect(maxSockets).to.equal(213);
    });

    it('uses node default with maxSockets set to false', { parallel: false }, async () => {

        let agent;
        const httpClient = {
            request(method, uri, options) {

                agent = options.agent;

                return { statusCode: 200 };
            }
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', httpClient, maxSockets: false } } });
        await server.inject('/');
        expect(agent).to.equal(undefined);
    });

    it('forwards on the response when making a GET request', async () => {

        const profileHandler = function (request, h) {

            return h.response({ id: 'fa0dbda9b1b', name: 'John Doe' }).state('test', '123');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/profile', handler: profileHandler, config: { cache: { expiresIn: 2000, privacy: 'private' } } });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/profile', handler: { proxy: { host: 'localhost', port: upstream.info.port, xforward: true, passThrough: true } } });
        server.state('auto', { autoValue: 'xyz' });

        const response = await server.inject('/profile');
        expect(response.statusCode).to.equal(200);
        expect(response.payload).to.contain('John Doe');
        expect(response.headers['set-cookie'][0]).to.include(['test=123']);
        expect(response.headers['set-cookie'][1]).to.include(['auto=xyz']);
        expect(response.headers['cache-control']).to.equal('max-age=2, must-revalidate, private');

        const res = await server.inject('/profile');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.contain('John Doe');

        await upstream.stop();
    });

    it('forwards on the response when making an OPTIONS request', async () => {

        const upstream = Hapi.server();
        upstream.route({ method: 'OPTIONS', path: '/', handler: () => 'test' });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({
            method: 'OPTIONS',
            path: '/',
            options: {
                payload: { parse: false },
                handler: (request, h) => h.proxy({ host: 'localhost', port: upstream.info.port })
            }
        });

        const res = await server.inject({ method: 'OPTIONS', url: '/' });
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.equal('test');

        await upstream.stop();
    });

    it('throws when used with explicit route payload config other than data or steam', async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        expect(() => {

            server.route({
                method: 'POST',
                path: '/',
                config: {
                    handler: {
                        proxy: { host: 'example.com' }
                    },
                    payload: {
                        output: 'file'
                    }
                }
            });
        }).to.throw('Cannot proxy if payload is parsed or if output is not stream or data');
    });

    it('throws when setup with invalid options', async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        expect(() => {

            server.route({
                method: 'POST',
                path: '/',
                config: {
                    handler: {
                        proxy: {}
                    }
                }
            });
        }).to.throw(/\"value\" must contain at least one of \[host, mapUri, uri\]/);
    });

    it('throws when used with explicit route payload parse config set to false', async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        expect(() => {

            server.route({
                method: 'POST',
                path: '/',
                config: {
                    handler: {
                        proxy: { host: 'example.com' }
                    },
                    payload: {
                        parse: true
                    }
                }
            });
        }).to.throw('Cannot proxy if payload is parsed or if output is not stream or data');
    });

    it('allows when used with explicit route payload output data config', async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        expect(() => {

            server.route({
                method: 'POST',
                path: '/',
                config: {
                    handler: {
                        proxy: { host: 'example.com' }
                    },
                    payload: {
                        output: 'data'
                    }
                }
            });
        }).to.not.throw();
    });

    it('uses protocol without ":"', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return 'ok';
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', port: upstream.info.port, protocol: 'http' } } });

        const res = await server.inject('/');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('ok');

        await upstream.stop();
    });

    it('forwards upstream headers', async () => {

        const headers = function (request, h) {

            return h.response({ status: 'success' })
                .header('Custom1', 'custom header value 1')
                .header('X-Custom2', 'custom header value 2')
                .header('x-hostFound', request.headers.host)
                .header('x-content-length-found', request.headers['content-length']);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/headers', handler: headers });
        await upstream.start();

        const server = Hapi.server({ routes: { cors: true } });
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/headers', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true } } });

        const res = await server.inject({
            url: '/headers',
            headers: {
                host: 'www.h2o2.com', 'content-length': 10000
            }
        });
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('{\"status\":\"success\"}');
        expect(res.headers.custom1).to.equal('custom header value 1');
        expect(res.headers['x-custom2']).to.equal('custom header value 2');
        expect(res.headers['x-hostFound']).to.equal(undefined);
        expect(res.headers['x-content-length-found']).to.equal(undefined);

        await upstream.stop();
    });

    it('merges upstream headers', async () => {

        const handler = function (request, h) {

            return h.response({ status: 'success' })
                .vary('X-Custom3');
        };

        const onResponse = function (err, res, request, h, settings, ttl) {

            expect(err).to.be.null();
            return h.response(res).vary('Something');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/headers', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/headers', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true, onResponse } } });

        const res = await server.inject({ url: '/headers', headers: { 'accept-encoding': 'gzip' } });
        expect(res.statusCode).to.equal(200);
        //expect(res.headers.vary).to.equal('X-Custom3,accept-encoding,Something');

        await upstream.stop();
    });

    it('forwards gzipped content', async () => {

        const gzipHandler = function (request, h) {

            return h.response('123456789012345678901234567890123456789012345678901234567890');
        };

        const upstream = Hapi.server({ compression: { minBytes: 1 } }); // Payloads under 1kb will not be compressed
        upstream.route({ method: 'GET', path: '/gzip', handler: gzipHandler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/gzip', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true } } });

        const zipped = await Zlib.gzipSync(Buffer.from('123456789012345678901234567890123456789012345678901234567890'));
        const res = await server.inject({ url: '/gzip', headers: { 'accept-encoding': 'gzip' } });

        expect(res.statusCode).to.equal(200);
        expect(res.rawPayload).to.equal(zipped);

        await upstream.stop();
    });

    it('forwards gzipped stream', async () => {

        const gzipStreamHandler = function (request, h) {

            return h.file(__dirname + '/../package.json');
        };

        const upstream = Hapi.server({ compression: { minBytes: 1 } });
        await upstream.register(Inert);
        upstream.route({ method: 'GET', path: '/gzipstream', handler: gzipStreamHandler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/gzipstream', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true } } });

        const res = await server.inject({ url: '/gzipstream', headers: { 'accept-encoding': 'gzip' } });
        const file = Fs.readFileSync(__dirname + '/../package.json', { encoding: 'utf8' });
        const unzipped = Zlib.unzipSync(res.rawPayload);

        expect(unzipped.toString('utf8')).to.equal(file);
        expect(res.statusCode).to.equal(200);

        await upstream.stop();
    });

    it('does not forward upstream headers without passThrough', async () => {

        const headers = function (request, h) {

            return h.response({ status: 'success' })
                .header('Custom1', 'custom header value 1')
                .header('X-Custom2', 'custom header value 2')
                .header('access-control-allow-headers', 'Invalid, List, Of, Values');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/noHeaders', handler: headers });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/noHeaders', handler: { proxy: { host: 'localhost', port: upstream.info.port } } });

        const res = await server.inject('/noHeaders');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('{\"status\":\"success\"}');
        expect(res.headers.custom1).to.not.exist();
        expect(res.headers['x-custom2']).to.not.exist();

        await upstream.stop();
    });

    it('request a cached proxy route', async () => {

        let activeCount = 0;
        const handler = function (request, h) {

            return h.response({
                id: '55cf687663',
                name: 'Active Items',
                count: activeCount++
            });
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/item', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/item', handler: { proxy: { host: 'localhost', port: upstream.info.port, protocol: 'http:' } }, config: { cache: { expiresIn: 500 } } });

        const response = await server.inject('/item');
        expect(response.statusCode).to.equal(200);
        expect(response.payload).to.contain('Active Items');
        const counter = response.result.count;

        const res = await server.inject('/item');
        expect(res.statusCode).to.equal(200);
        expect(res.result.count).to.equal(counter);

        await upstream.stop();
    });

    it('forwards on the status code when making a POST request', async () => {

        const item = function (request, h) {

            return h.response({ id: '55cf687663', name: 'Items' }).created('http://example.com');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'POST', path: '/item', handler: item });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'POST', path: '/item', handler: { proxy: { host: 'localhost', port: upstream.info.port } } });

        const res = await server.inject({ url: '/item', method: 'POST' });
        expect(res.statusCode).to.equal(201);
        expect(res.payload).to.contain('Items');

        await upstream.stop();
    });

    it('sends the correct status code when a request is unauthorized', async () => {

        const unauthorized = function (request, h) {

            throw Boom.unauthorized('Not authorized');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/unauthorized', handler: unauthorized });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/unauthorized', handler: { proxy: { host: 'localhost', port: upstream.info.port } }, config: { cache: { expiresIn: 500 } } });

        const res = await server.inject('/unauthorized');
        expect(res.statusCode).to.equal(401);

        await upstream.stop();
    });

    it('sends a 404 status code when a proxied route does not exist', async () => {

        const upstream = Hapi.server();
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'POST', path: '/notfound', handler: { proxy: { host: 'localhost', port: upstream.info.port } } });

        const res = await server.inject('/notfound');
        expect(res.statusCode).to.equal(404);

        await upstream.stop();
    });

    it('overrides status code when a custom onResponse returns an error', async () => {

        const onResponseWithError = function (err, res, request, h, settings, ttl) {

            expect(err).to.be.null();
            throw Boom.forbidden('Forbidden');
        };

        const upstream = Hapi.server();
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/onResponseError', handler: { proxy: { host: 'localhost', port: upstream.info.port, onResponse: onResponseWithError } } });

        const res = await server.inject('/onResponseError');
        expect(res.statusCode).to.equal(403);

        await upstream.stop();
    });

    it('adds cookie to response', async () => {

        const on = function (err, res, request, h, settings, ttl) {

            expect(err).to.be.null();
            return h.response(res).state('a', 'b');
        };

        const upstream = Hapi.server();
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', port: upstream.info.port, onResponse: on } } });

        const res = await server.inject('/');

        expect(res.statusCode).to.equal(404);
        expect(res.headers['set-cookie'][0]).to.equal('a=b; Secure; HttpOnly; SameSite=Strict');

        await upstream.stop();
    });

    it('calls onRequest when it\'s created', async () => {

        const upstream = Hapi.Server();

        let upstreamRequested = false;
        upstream.events.on('request', () => {

            upstreamRequested = true;
        });

        await upstream.start();

        let called = false;
        const onRequestWithSocket = function (req) {

            called = true;
            expect(upstreamRequested).to.be.false();
            expect(req).to.be.an.instanceof(Http.ClientRequest);
        };

        const on = function (err, res, request, h, settings, ttl) {

            expect(err).to.be.null();
            return h.response(h.context.c);
        };

        const handler = {
            proxy: {
                host: 'localhost',
                port: upstream.info.port,
                onRequest: onRequestWithSocket,
                onResponse: on
            }
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/onRequestSocket', config: { handler, bind: { c: 6 } } });

        const res = await server.inject('/onRequestSocket');

        expect(res.result).to.equal(6);
        expect(called).to.equal(true);
        await upstream.stop();
    });

    it('binds onResponse to route bind config', async () => {

        const onResponseWithError = function (err, res, request, h, settings, ttl) {

            expect(err).to.be.null();
            return h.response(h.context.c);
        };

        const upstream = Hapi.server();
        await upstream.start();

        const handler = {
            proxy: {
                host: 'localhost',
                port: upstream.info.port,
                onResponse: onResponseWithError
            }
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/onResponseError', config: { handler, bind: { c: 6 } } });

        const res = await server.inject('/onResponseError');
        expect(res.result).to.equal(6);

        await upstream.stop();
    });

    it('binds onResponse to route bind config in plugin', async () => {

        const upstream = Hapi.server();
        await upstream.start();

        const plugin = {
            register: function (server, optionos) {

                const onResponseWithError = function (err, res, request, h, settings, ttl) {

                    expect(err).to.be.null();
                    return h.response(h.context.c);
                };

                const handler = {
                    proxy: {
                        host: 'localhost',
                        port: upstream.info.port,
                        onResponse: onResponseWithError
                    }
                };

                server.route({ method: 'GET', path: '/', config: { handler, bind: { c: 6 } } });
            },
            name: 'test'
        };

        const server = Hapi.server();
        await server.register(H2o2);

        await server.register(plugin);

        const res = await server.inject('/');
        expect(res.result).to.equal(6);

        await upstream.stop();
    });

    it('binds onResponse to plugin bind', async () => {

        const upstream = Hapi.server();
        await upstream.start();

        const plugin = {
            register: function (server, options) {

                const onResponseWithError = function (err, res, request, h, settings, ttl) {

                    expect(err).to.be.null();
                    return h.response(h.context.c);
                };

                const handler = {
                    proxy: {
                        host: 'localhost',
                        port: upstream.info.port,
                        onResponse: onResponseWithError
                    }
                };

                server.bind({ c: 7 });
                server.route({ method: 'GET', path: '/', config: { handler } });
            },
            name: 'test'
        };

        const server = Hapi.server();
        await server.register(H2o2);

        await server.register(plugin);

        const res = await server.inject('/');
        expect(res.result).to.equal(7);

        await upstream.stop();
    });

    it('binds onResponse to route bind config in plugin when plugin also has bind', async () => {

        const upstream = Hapi.server();
        await upstream.start();

        const plugin = {
            register: function (server, options) {

                const onResponseWithError = function (err, res, request, h, settings, ttl) {

                    expect(err).to.be.null();
                    return h.response(h.context.c);
                };

                const handler = {
                    proxy: {
                        host: 'localhost',
                        port: upstream.info.port,
                        onResponse: onResponseWithError
                    }
                };

                server.bind({ c: 7 });
                server.route({ method: 'GET', path: '/', config: { handler, bind: { c: 4 } } });
            },
            name: 'test'
        };

        const server = Hapi.server();
        await server.register(H2o2);

        await server.register(plugin);

        const res = await server.inject('/');
        expect(res.result).to.equal(4);

        await upstream.stop();
    });

    it('calls the onResponse function if the upstream is unreachable', async () => {

        const failureResponse = function (err, res, request, h, settings, ttl) {

            expect(h.response).to.exist();
            throw err;
        };

        const dummy = Hapi.server();
        await dummy.start();
        const dummyPort = dummy.info.port;
        await dummy.stop(Hoek.ignore);

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/failureResponse', handler: { proxy: { host: 'localhost', port: dummyPort, onResponse: failureResponse } }, config: { cache: { expiresIn: 500 } } });

        const res = await server.inject('/failureResponse');
        expect(res.statusCode).to.equal(502);
    });

    it('sets x-forwarded-* headers', async () => {

        const handler = function (request, h) {

            return h.response(request.raw.req.headers);
        };

        const host = '127.0.0.1';

        const upstream = Hapi.server({ host });
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const server = Hapi.server({ host, tls: tlsOptions });
        await server.register(H2o2);

        server.route({
            method: 'GET',
            path: '/',
            handler: {
                proxy: {
                    host: upstream.info.host,
                    port: upstream.info.port,
                    protocol: 'http',
                    xforward: true
                }
            }
        });
        await server.start();

        const requestProtocol = 'https';
        const response = await Wreck.get(`${requestProtocol}://${server.info.host}:${server.info.port}/`, {
            rejectUnauthorized: false
        });
        expect(response.res.statusCode).to.equal(200);

        const result = JSON.parse(response.payload);
        let expectedClientAddress = '127.0.0.1';
        let expectedClientAddressAndPort = expectedClientAddress + ':' + server.info.port;

        if (Net.isIPv6(server.listener.address().address)) {
            expectedClientAddress = '::ffff:127.0.0.1';
            expectedClientAddressAndPort = '[' + expectedClientAddress + ']:' + server.info.port;
        }

        expect(result['x-forwarded-for']).to.equal(expectedClientAddress);
        expect(result['x-forwarded-port']).to.match(/\d+/);
        expect(result['x-forwarded-proto']).to.equal(requestProtocol);
        expect(result['x-forwarded-host']).to.equal(expectedClientAddressAndPort);

        await server.stop();
        await upstream.stop();
    });

    it('adds x-forwarded-for headers to existing and preserves original port, proto and host', async () => {

        const handler = function (request, h) {

            return h.response(request.raw.req.headers);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const mapUri = function (request) {

            const headers = {
                'x-forwarded-for': 'testhost',
                'x-forwarded-port': 1337,
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'example.com'
            };

            return {
                uri: `http://127.0.0.1:${upstream.info.port}/`,
                headers
            };
        };

        const server = Hapi.server({ host: '127.0.0.1' });
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { mapUri, xforward: true } } });
        await server.start();

        const response = await Wreck.get('http://127.0.0.1:' + server.info.port + '/');
        expect(response.res.statusCode).to.equal(200);

        const result = JSON.parse(response.payload);

        let expectedClientAddress = '127.0.0.1';
        if (Net.isIPv6(server.listener.address().address)) {
            expectedClientAddress = '::ffff:127.0.0.1';
        }

        expect(result['x-forwarded-for']).to.equal('testhost,' + expectedClientAddress);
        expect(result['x-forwarded-port']).to.equal('1337');
        expect(result['x-forwarded-proto']).to.equal('https');
        expect(result['x-forwarded-host']).to.equal('example.com');

        await upstream.stop();
        await server.stop();
    });

    it('does not clobber existing x-forwarded-* headers', async () => {

        const handler = function (request, h) {

            return h.response(request.raw.req.headers);
        };

        const mapUri = function (request) {

            const headers = {
                'x-forwarded-for': 'testhost',
                'x-forwarded-port': 1337,
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'example.com'
            };

            return {
                uri: `http://127.0.0.1:${upstream.info.port}/`,
                headers
            };
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { mapUri, xforward: true } } });

        const res = await server.inject('/');
        const result = JSON.parse(res.payload);
        expect(res.statusCode).to.equal(200);
        expect(result['x-forwarded-for']).to.equal('testhost');
        expect(result['x-forwarded-port']).to.equal('1337');
        expect(result['x-forwarded-proto']).to.equal('https');
        expect(result['x-forwarded-host']).to.equal('example.com');

        await upstream.stop();
    });

    it('forwards on a POST body', async () => {

        const echoPostBody = function (request, h) {

            return h.response(request.payload.echo + request.raw.req.headers['x-super-special']);
        };

        const mapUri = function (request) {

            return {
                uri: `http://127.0.0.1:${upstream.info.port}${request.path}${(request.url.search || '')}`,
                headers: { 'x-super-special': '@' }
            };
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'POST', path: '/echo', handler: echoPostBody });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'POST', path: '/echo', handler: { proxy: { mapUri } } });

        const res = await server.inject({ url: '/echo', method: 'POST', payload: '{"echo":true}' });
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('true@');

        await upstream.stop();
    });

    it('replies with an error when it occurs in mapUri', async () => {

        const mapUriWithError = function (request) {

            throw new Error('myerror');
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/maperror', handler: { proxy: { mapUri: mapUriWithError } } });
        const res = await server.inject('/maperror');

        expect(res.statusCode).to.equal(500);
    });

    it('maxs out redirects to same endpoint', async () => {

        const redirectHandler = function (request, h) {

            return h.redirect('/redirect?x=1');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/redirect', handler: redirectHandler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/redirect', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true, redirects: 2 } } });

        const res = await server.inject('/redirect?x=1');
        expect(res.statusCode).to.equal(502);

        await upstream.stop();
    });

    it('errors on redirect missing location header', async () => {

        const redirectHandler = function (request, h) {

            return h.response().code(302);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/redirect', handler: redirectHandler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/redirect', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true, redirects: 2 } } });

        const res = await server.inject('/redirect?x=3');
        expect(res.statusCode).to.equal(502);

        await upstream.stop();
    });

    it('errors on redirection to bad host', async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/nowhere', handler: { proxy: { host: 'no.such.domain.x8' } } });

        const res = await server.inject('/nowhere');
        expect(res.statusCode).to.equal(502);
    });

    it('errors on redirection to bad host (https)', async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/nowhere', handler: { proxy: { host: 'no.such.domain.x8', protocol: 'https' } } });

        const res = await server.inject('/nowhere');
        expect(res.statusCode).to.equal(502);
    });

    it('redirects to another endpoint', async () => {

        const redirectHandler = function (request, h) {

            return h.redirect('/profile');
        };

        const profile = function (request, h) {

            return h.response({ id: 'fa0dbda9b1b', name: 'John Doe' }).state('test', '123');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/redirect', handler: redirectHandler });
        upstream.route({ method: 'GET', path: '/profile', handler: profile, config: { cache: { expiresIn: 2000 } } });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/redirect', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true, redirects: 2 } } });
        server.state('auto', { autoValue: 'xyz' });

        const res = await server.inject('/redirect');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.contain('John Doe');
        expect(res.headers['set-cookie'][0]).to.include(['test=123']);
        expect(res.headers['set-cookie'][1]).to.include(['auto=xyz']);

        await upstream.stop();
    });

    it('redirects to another endpoint with relative location', async () => {

        const redirectHandler = function (request, h) {

            return h.response().header('Location', '//localhost:' + request.server.info.port + '/profile').code(302);
        };

        const profile = function (request, h) {

            return h.response({ id: 'fa0dbda9b1b', name: 'John Doe' }).state('test', '123');
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/redirect', handler: redirectHandler });
        upstream.route({ method: 'GET', path: '/profile', handler: profile, config: { cache: { expiresIn: 2000 } } });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/redirect', handler: { proxy: { host: 'localhost', port: upstream.info.port, passThrough: true, redirects: 2 } } });
        server.state('auto', { autoValue: 'xyz' });

        const res = await server.inject('/redirect?x=2');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.contain('John Doe');
        expect(res.headers['set-cookie'][0]).to.include(['test=123']);
        expect(res.headers['set-cookie'][1]).to.include(['auto=xyz']);

        await upstream.stop();
    });

    it('redirects to a post endpoint with stream', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'POST',
            path: '/post1',
            handler: function (request, h) {

                return h.redirect('/post2').rewritable(false);
            }
        });
        upstream.route({
            method: 'POST',
            path: '/post2',
            handler: function (request, h) {

                return h.response(request.payload);
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'POST', path: '/post1', handler: { proxy: { host: 'localhost', port: upstream.info.port, redirects: 3 } }, config: { payload: { output: 'stream' } } });

        const res = await server.inject({ method: 'POST', url: '/post1', payload: 'test', headers: { 'content-type': 'text/plain' } });
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('test');

        await upstream.stop();
    });

    it('errors when proxied request times out', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/timeout1',
            handler: function (request, h) {

                return new Promise((resolve, reject) => {

                    setTimeout(() => {

                        return resolve(h.response('Ok'));
                    }, 10);
                });

            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/timeout1', handler: { proxy: { host: 'localhost', port: upstream.info.port, timeout: 5 } } });

        const res = await server.inject('/timeout1');
        expect(res.statusCode).to.equal(504);

        await upstream.stop();
    });

    it('uses default timeout when nothing is set', async () => {

        const upstream = Hapi.server();
        upstream.route({

            method: 'GET',
            path: '/timeout2',
            handler: function (request, h) {

                return new Promise((resolve, reject) => {

                    setTimeout(() => {

                        return resolve(h.response('Ok'));
                    }, 10);
                });
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/timeout2', handler: { proxy: { host: 'localhost', port: upstream.info.port } } });

        const res = await server.inject('/timeout2');
        expect(res.statusCode).to.equal(200);

        await upstream.stop();
    });

    it('uses rejectUnauthorized to allow proxy to self sign ssl server', async () => {


        const upstream = Hapi.server({ tls: tlsOptions });
        upstream.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.response('Ok');
            }
        });

        await upstream.start();

        const mapSslUri = function (request) {

            return {
                uri: `https://127.0.0.1:${upstream.info.port}`
            };
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/allow', handler: { proxy: { mapUri: mapSslUri, rejectUnauthorized: false } } });
        await server.start();

        const res = await server.inject('/allow');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('Ok');

        await server.stop();
        await upstream.stop();
    });

    it('uses rejectUnauthorized to not allow proxy to self sign ssl server', async () => {

        const upstream = Hapi.server({ tls: tlsOptions });
        upstream.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.response('Ok');
            }
        });

        await upstream.start();

        const mapSslUri = function (request, h) {

            return {
                uri: `https://127.0.0.1:${upstream.info.port}`
            };
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/reject', handler: { proxy: { mapUri: mapSslUri, rejectUnauthorized: true } } });
        await server.start();

        const res = await server.inject('/reject');
        expect(res.statusCode).to.equal(502);

        await server.stop();
        await upstream.stop();
    });

    it('the default rejectUnauthorized should not allow proxied server cert to be self signed', async () => {

        const upstream = Hapi.server({ tls: tlsOptions });
        upstream.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.response('Ok');
            }
        });

        await upstream.start();

        const mapSslUri = function (request) {

            return { uri: `https://127.0.0.1:${upstream.info.port}` };
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/sslDefault', handler: { proxy: { mapUri: mapSslUri } } });
        await server.start();

        const res = await server.inject('/sslDefault');
        expect(res.statusCode).to.equal(502);

        await server.stop();
        await upstream.stop();
    });

    it('times out when proxy timeout is less than server', { parallel: false }, async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/timeout2',
            handler: function (request, h) {

                return new Promise((resolve, reject) => {

                    setTimeout(() => {

                        return resolve(h.response('Ok'));
                    }, 10);
                });

            }
        });

        await upstream.start();

        const server = Hapi.server({ routes: { timeout: { server: 8 } } });
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/timeout2', handler: { proxy: { host: 'localhost', port: upstream.info.port, timeout: 2 } } });
        await server.start();

        const res = await server.inject('/timeout2');
        expect(res.statusCode).to.equal(504);

        await server.stop();
        await upstream.stop();
    });

    it('times out when server timeout is less than proxy', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/timeout1',
            handler: function (request, h) {

                return new Promise((resolve, reject) => {

                    setTimeout(() => {

                        return resolve(h.response('Ok'));
                    }, 10);
                });
            }
        });

        await upstream.start();

        const server = Hapi.server({ routes: { timeout: { server: 5 } } });
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/timeout1', handler: { proxy: { host: 'localhost', port: upstream.info.port, timeout: 15 } } });

        const res = await server.inject('/timeout1');
        expect(res.statusCode).to.equal(503);

        await upstream.stop();
    });

    it('proxies via uri template', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/item',
            handler: function (request, h) {

                return h.response({ a: 1 });
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/handlerTemplate', handler: { proxy: { uri: '{protocol}://localhost:' + upstream.info.port + '/item' } } });
        await server.start();

        const res = await server.inject('/handlerTemplate');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.contain('"a":1');

        await server.stop();
        await upstream.stop();
    });

    it('proxies via uri template with request.param variables', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/item/{param_a}/{param_b}',
            handler: function (request, h) {

                return h.response({ a: request.params.param_a, b: request.params.param_b });
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/handlerTemplate/{a}/{b}', handler: { proxy: { uri: 'http://localhost:' + upstream.info.port + '/item/{a}/{b}' } } });

        const prma = 'foo';
        const prmb = 'bar';
        const res = await server.inject(`/handlerTemplate/${prma}/${prmb}`);
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.contain(`"a":"${prma}"`);
        expect(res.payload).to.contain(`"b":"${prmb}"`);

        await upstream.stop();
    });

    it('passes upstream caching headers', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/cachedItem',
            handler: function (request, h) {

                return h.response({ a: 1 });
            },
            config: {
                cache: {
                    expiresIn: 2000
                }
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/cachedItem', handler: { proxy: { host: 'localhost', port: upstream.info.port, ttl: 'upstream' } } });
        server.state('auto', { autoValue: 'xyz' });
        await server.start();

        const res = await server.inject('/cachedItem');
        expect(res.statusCode).to.equal(200);
        expect(res.headers['cache-control']).to.equal('max-age=2, must-revalidate');

        await server.stop();
        await upstream.stop();
    });

    it('ignores when no upstream caching headers to pass', async () => {

        const upstream = Http.createServer((req, res) => {

            res.end('not much');
        });
        await upstream.listen();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', port: upstream.address().port, ttl: 'upstream' } } });

        const res = await server.inject('/');
        expect(res.statusCode).to.equal(200);
        expect(res.headers['cache-control']).to.equal('no-cache');

        await upstream.close();
    });

    it('ignores when upstream caching header is invalid', async () => {

        const upstream = Http.createServer((req, res) => {

            res.writeHeader(200, { 'cache-control': 'some crap that does not work' });
            res.end('not much');
        });

        await upstream.listen();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', port: upstream.address().port, ttl: 'upstream' } } });

        const res = await server.inject('/');
        expect(res.statusCode).to.equal(200);
        expect(res.headers['cache-control']).to.equal('no-cache');

        await upstream.close();
    });

    it('overrides response code with 304', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/item',
            handler: function (request, h) {

                return h.response({ a: 1 });
            }
        });

        await upstream.start();

        const onResponse304 = function (err, res, request, h, settings, ttl) {

            expect(err).to.be.null();
            return h.response(res).code(304);
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/304', handler: { proxy: { uri: 'http://localhost:' + upstream.info.port + '/item', onResponse: onResponse304 } } });

        const res = await server.inject('/304');
        expect(res.statusCode).to.equal(304);
        expect(res.payload).to.equal('');

        await upstream.stop();
    });

    it('cleans up when proxy response replaced in onPreResponse', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/item',
            handler: function (request, h) {

                return h.response({ a: 1 });
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.ext('onPreResponse', (request, h) => {

            return h.response({ something: 'else' });
        });
        server.route({ method: 'GET', path: '/item', handler: { proxy: { host: 'localhost', port: upstream.info.port } } });

        const res = await server.inject('/item');
        expect(res.statusCode).to.equal(200);
        expect(res.result.something).to.equal('else');

        await upstream.stop();
    });

    it('retails accept-encoding header', async () => {

        const profile = function (request, h) {

            return h.response(request.headers['accept-encoding']);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler: profile, config: { cache: { expiresIn: 2000 } } });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', port: upstream.info.port, acceptEncoding: true, passThrough: true } } });

        const res = await server.inject({ url: '/', headers: { 'accept-encoding': '*/*' } });
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('*/*');

        await upstream.stop();
    });

    it('removes accept-encoding header', async () => {

        const profile = function (request, h) {

            return h.response(request.headers['accept-encoding']);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler: profile, config: { cache: { expiresIn: 2000 } } });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', port: upstream.info.port, acceptEncoding: false, passThrough: true } } });

        const res = await server.inject({ url: '/', headers: { 'accept-encoding': '*/*' } });
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('');

        await upstream.stop();
    });

    it('does not send multiple Content-Type headers on passthrough', { parallel: false }, async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        const httpClient = {
            request(method, uri, options, callback) {

                expect(options.headers['content-type']).to.equal('application/json');
                expect(options.headers['Content-Type']).to.not.exist();
                throw new Error('placeholder');
            }
        };
        server.route({ method: 'GET', path: '/test', handler: { proxy: { uri: 'http://localhost', httpClient, passThrough: true } } });
        await server.inject({ method: 'GET', url: '/test', headers: { 'Content-Type': 'application/json' } });
    });

    it('allows passing in an agent through to Wreck', { parallel: false }, async () => {

        const server = Hapi.server();
        await server.register(H2o2);

        const agent = { name: 'myagent' };

        const httpClient = {
            request(method, uri, options, callback) {

                expect(options.agent).to.equal(agent);
                return { statusCode: 200 };
            }
        };
        server.route({ method: 'GET', path: '/agenttest', handler: { proxy: { uri: 'http://localhost', httpClient, agent } } });
        await server.inject({ method: 'GET', url: '/agenttest', headers: {} }, (res) => { });
    });

    it('excludes request cookies defined locally', async () => {

        const handler = function (request, h) {

            return h.response(request.state);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.state('a');

        server.route({
            method: 'GET',
            path: '/',
            handler: {
                proxy: {
                    host: 'localhost',
                    port: upstream.info.port,
                    passThrough: true
                }
            }
        });

        const res = await server.inject({ url: '/', headers: { cookie: 'a=1;b=2' } });
        expect(res.statusCode).to.equal(200);

        const cookies = JSON.parse(res.payload);
        expect(cookies).to.equal({ b: '2' });

        await upstream.stop();
    });

    it('includes request cookies defined locally (route level)', async () => {

        const handler = function (request, h) {

            return h.response(request.state);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.state('a', { passThrough: true });
        server.route({
            method: 'GET',
            path: '/',
            handler: {
                proxy: {
                    host: 'localhost',
                    port: upstream.info.port,
                    passThrough: true,
                    localStatePassThrough: true
                }
            }
        });
        const res = await server.inject({ url: '/', headers: { cookie: 'a=1;b=2' } });
        expect(res.statusCode).to.equal(200);

        const cookies = JSON.parse(res.payload);
        expect(cookies).to.equal({ a: '1', b: '2' });

        await upstream.stop();
    });

    it('includes request cookies defined locally (cookie level)', async () => {

        const handler = function (request, h) {

            return h.response(request.state);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.state('a', { passThrough: true });
        server.route({
            method: 'GET',
            path: '/',
            handler: {
                proxy: {
                    host: 'localhost',
                    port: upstream.info.port,
                    passThrough: true
                }
            }
        });

        const res = await server.inject({ url: '/', headers: { cookie: 'a=1;b=2' } });
        expect(res.statusCode).to.equal(200);

        const cookies = JSON.parse(res.payload);
        expect(cookies).to.equal({ a: '1', b: '2' });

        await upstream.stop();
    });

    it('errors on invalid cookie header', async () => {

        const server = Hapi.server({ routes: { state: { failAction: 'ignore' } } });
        await server.register(H2o2);

        server.state('a', { passThrough: true });

        server.route({
            method: 'GET',
            path: '/',
            handler: {
                proxy: {
                    host: 'localhost',
                    port: 8080,
                    passThrough: true
                }
            }
        });

        const res = await server.inject({ url: '/', headers: { cookie: 'a' } });
        expect(res.statusCode).to.equal(400);
    });

    it('drops cookies when all defined locally', async () => {

        const handler = function (request, h) {

            return h.response(request.state);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.state('a');
        server.route({
            method: 'GET',
            path: '/',
            handler: {
                proxy: {
                    host: 'localhost',
                    port: upstream.info.port,
                    passThrough: true
                }
            }
        });

        const res = await server.inject({ url: '/', headers: { cookie: 'a=1' } });
        expect(res.statusCode).to.equal(200);

        const cookies = JSON.parse(res.payload);
        expect(cookies).to.equal({});

        await upstream.stop();
    });

    it('excludes request cookies defined locally (state override)', async () => {

        const handler = function (request, h) {

            return h.response(request.state);
        };

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler });
        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.state('a', { passThrough: false });
        server.route({
            method: 'GET',
            path: '/',
            handler: {
                proxy: {
                    host: 'localhost',
                    port: upstream.info.port,
                    passThrough: true
                }
            }
        });

        const res = await server.inject({ url: '/', headers: { cookie: 'a=1;b=2' } });
        expect(res.statusCode).to.equal(200);

        const cookies = JSON.parse(res.payload);
        expect(cookies).to.equal({ b: '2' });

        await upstream.stop();
    });

    it('uses reply decorator', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.response('ok');
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.proxy({ host: 'localhost', port: upstream.info.port, xforward: true, passThrough: true });
            }
        });

        const res = await server.inject('/');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('ok');

        await upstream.stop();
    });

    it('uses custom TLS settings', async () => {

        const upstream = Hapi.server({ tls: tlsOptions });
        upstream.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.response('ok');
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register({ plugin: H2o2, options: { secureProtocol: 'TLSv1_2_method', ciphers: 'ECDHE-RSA-AES128-SHA256' } });
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.proxy({ host: '127.0.0.1', protocol: 'https', port: upstream.info.port, rejectUnauthorized: false });
            }
        });

        const res = await server.inject('/');
        expect(res.statusCode).to.equal(200);
        expect(res.payload).to.equal('ok');

        await upstream.stop();
    });

    it('adds downstreamResponseTime to the response when downstreamResponseTime is set to true on success', async () => {

        const upstream = Hapi.server();
        upstream.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.response('ok');
            }
        });

        await upstream.start();

        const server = Hapi.server();
        await server.register({ plugin: H2o2, options: { downstreamResponseTime: true } });
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.proxy({ host: 'localhost', port: upstream.info.port, xforward: true, passThrough: true });
            }
        });

        server.events.on('request', (request, event, tags) => {

            expect(Object.keys(event.data)).to.equal(['downstreamResponseTime']);
            expect(tags).to.equal({ h2o2: true, success: true });
        });

        const res = await server.inject('/');
        expect(res.statusCode).to.equal(200);

        await upstream.stop();
    });

    it('adds downstreamResponseTime to the response when downstreamResponseTime is set to true on error', async () => {

        const failureResponse = function (err, res, request, h, settings, ttl) {

            expect(h.response).to.exist();
            throw err;
        };

        const dummy = Hapi.server();
        await dummy.start();
        const dummyPort = dummy.info.port;
        await dummy.stop(Hoek.ignore);

        const options = { downstreamResponseTime: true };

        const server = Hapi.server();
        await server.register({ plugin: H2o2, options });
        server.route({ method: 'GET', path: '/failureResponse', handler: { proxy: { host: 'localhost', port: dummyPort, onResponse: failureResponse } }, config: { cache: { expiresIn: 500 } } });

        let firstEvent = true;
        server.events.on('request', (request, event, tags) => {

            if (firstEvent) {
                firstEvent = false;
                expect(Object.keys(event.data)).to.equal(['downstreamResponseTime']);
                expect(tags).to.equal({ h2o2: true, error: true });
            }
        });

        const res = await server.inject('/failureResponse');
        expect(res.statusCode).to.equal(502);
    });

    it('uses a custom http-client', async () => {

        const upstream = Hapi.server();
        upstream.route({ method: 'GET', path: '/', handler: () => 'ok' });
        await upstream.start();

        const httpClient = {
            request: Wreck.request.bind(Wreck),
            parseCacheControl: Wreck.parseCacheControl.bind(Wreck)
        };

        const server = Hapi.server();
        await server.register(H2o2);

        server.route({ method: 'GET', path: '/', handler: { proxy: { host: 'localhost', port: upstream.info.port, httpClient } } });

        const res = await server.inject('/');

        expect(res.payload).to.equal('ok');
    });
});
