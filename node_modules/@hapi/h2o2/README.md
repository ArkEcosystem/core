<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# h2o2

Proxy handler plugin for hapi.js.

[![Build Status](https://secure.travis-ci.org/hapijs/h2o2.png)](http://travis-ci.org/hapijs/h2o2)

## Introduction

**h2o2** adds proxying functionality to a hapi server.

## Manual loading

```javascript
const Hapi = require('@hapi/hapi');
const H2o2 = require('@hapi/h2o2');


const start = async function() {

  const server = Hapi.server();
  try {
    await server.register(H2o2);
    await server.start();

    console.log(`Server started at:  ${server.info.uri}`);
  }
  catch(e) {
    console.log('Failed to load h2o2');
  }
}

start();
```

## Options

The plugin can be registered with an optional object specifying defaults to be applied to the proxy handler object.

The proxy handler object has the following properties:

* `host` - upstream service host to proxy requests to. It will have the same path as the client request.
* `port` - upstream service port.
* `protocol` - protocol to use when making the request to the proxied host:
    * 'http'
    * 'https'
* `uri` - absolute URI used instead of host, port, protocol, path, and query. Cannot be used with `host`, `port`, `protocol`, or `mapUri`.
* `httpClient` - an http client that abides by the Wreck interface. Defaults to [`wreck`](https://github.com/hapijs/wreck).
* `passThrough` - if set to `true`, it forwards the headers from the client to the upstream service, headers sent from the upstream service will also be forwarded to the client. Defaults to `false`.
* `localStatePassThrough` - if set to`false`, any locally defined state is removed from incoming requests before being sent to the upstream service. This value can be overridden on a per state basis via the `server.state()` `passThrough` option. Defaults to `false`
* `acceptEncoding` - if set to `false`, does not pass-through the 'Accept-Encoding' HTTP header which is useful for the `onResponse` post-processing to avoid receiving an encoded response. Can only be used together with `passThrough`. Defaults to `true` (passing header).
* `rejectUnauthorized` - sets the `rejectUnauthorized` property on the https [agent](http://nodejs.org/api/https.html#https_https_request_options_callback) making the request. This value is only used when the proxied server uses TLS/SSL. If set it will override the node.js `rejectUnauthorized` property. If `false` then ssl errors will be ignored. When `true` the server certificate is verified and an 500 response will be sent when verification fails. This shouldn't be used alongside the `agent` setting as the `agent` will be used instead. Defaults to the https agent default value of `true`.
* `xforward` - if set to `true`, sets the 'X-Forwarded-For', 'X-Forwarded-Port', 'X-Forwarded-Proto', 'X-Forwarded-Host' headers when making a request to the proxied upstream endpoint. Defaults to `false`.
* `redirects` - the maximum number of HTTP redirections allowed to be followed automatically by the handler. Set to `false` or `0` to disable all redirections (the response will contain the redirection received from the upstream service). If redirections are enabled, no redirections (301, 302, 307, 308) will be passed along to the client, and reaching the maximum allowed redirections will return an error response. Defaults to `false`.
* `timeout` - number of milliseconds before aborting the upstream request. Defaults to `180000` (3 minutes).
* `mapUri` - a function used to map the request URI to the proxied URI. Cannot be used together with `host`, `port`, `protocol`, or `uri`. The function signature is `function (request)` where:
    * `request` - is the incoming [request object](http://hapijs.com/api#request-object). The response from this function should be an       object with the following properties:
        * `uri` - the absolute proxy URI.
        * `headers` - optional object where each key is an HTTP request header and the value is the header content.
* `onRequest` - a custom function which is passed the upstream request.  Function signature is `function (req)` where:
    * `req` - the [wreck] (https://github.com/hapijs/wreck) request to the upstream server.
* `onResponse` - a custom function for processing the response from the upstream service before sending to the client. Useful for custom error handling of responses from the proxied endpoint or other payload manipulation. Function signature is `function (err, res, request, h, settings, ttl)` where:
    * `err` - internal or upstream error returned from attempting to contact the upstream proxy.
    * `res` - the node response object received from the upstream service. `res` is a readable stream (use the [wreck](https://github.com/hapijs/wreck) module `read` method to easily convert it to a Buffer or string).
    * `request` - is the incoming [request object](http://hapijs.com/api#request-object).
    * `h` - the [response toolkit](https://hapijs.com/api#response-toolkit).
    * `settings` - the proxy handler configuration.
    * `ttl` - the upstream TTL in milliseconds if `proxy.ttl` it set to `'upstream'` and the upstream response included a valid 'Cache-Control' header with 'max-age'.
* `ttl` - if set to `'upstream'`, applies the upstream response caching policy to the response using the `response.ttl()` method (or passed as an argument to the `onResponse` method if provided).
* `agent` - a node [http(s) agent](http://nodejs.org/api/http.html#http_class_http_agent) to be used for connections to upstream server.
* `maxSockets` - sets the maximum number of sockets available per outgoing proxy host connection. `false` means use the **wreck** module default value (`Infinity`). Does not affect non-proxy outgoing client connections. Defaults to `Infinity`.
* `secureProtocol` - [TLS](http://nodejs.org/api/tls.html) flag indicating the SSL method to use, e.g. `SSLv3_method`
to force SSL version 3. The possible values depend on your installation of OpenSSL. Read the official OpenSSL docs for possible [SSL_METHODS](https://www.openssl.org/docs/man1.0.2/ssl/ssl.html).
* `ciphers` - [TLS](https://nodejs.org/api/tls.html#tls_modifying_the_default_tls_cipher_suite) list of TLS ciphers to override node's default.
The possible values depend on your installation of OpenSSL. Read the official OpenSSL docs for possible [TLS_CIPHERS](https://www.openssl.org/docs/man1.0.2/apps/ciphers.html#CIPHER-LIST-FORMAT).
* `downstreamResponseTime` - logs the time spent processing the downstream request using [process.hrtime](https://nodejs.org/api/process.html#process_process_hrtime_time). Defaults to `false`.

## Usage

As one of the handlers for hapi, it is used through the route configuration object.

### `h.proxy(options)`

Proxies the request to an upstream endpoint where:
- `options` - an object including the same keys and restrictions defined by the
 [route `proxy` handler options](#options).

No return value.

The [response flow control rules](http://hapijs.com/api#flow-control) **do not** apply.

```js
const handler = function (request, h) {

    return h.proxy({ host: 'example.com', port: 80, protocol: 'http' });
};
```

### Using the `host`, `port`, `protocol` options

Setting these options will send the request to certain route to a specific upstream service with the same path as the original request. Cannot be used with `uri`, `mapUri`.

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: {
        proxy: {
            host: '10.33.33.1',
            port: '443',
            protocol: 'https'
        }
    }
});
```

### Using the `uri` option

Setting this option will send the request to an absolute URI instead of the incoming host, port, protocol, path and query. Cannot be used with `host`, `port`, `protocol`, `mapUri`.

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: {
        proxy: {
            uri: 'https://some.upstream.service.com/that/has?what=you&want=todo'
        }
    }
});
```
### Custom `uri` template values

When using the `uri` option, there are optional **default** template values that can be injected from the incoming `request`:

* `{protocol}`
* `{host}`
* `{port}`
* `{path}`

```javascript
server.route({
    method: 'GET',
    path: '/foo',
    handler: {
        proxy: {
            uri: '{protocol}://{host}:{port}/go/to/{path}'
        }
    }
});
```
Requests to `http://127.0.0.1:8080/foo/` would be proxied to an upstream destination of `http://127.0.0.1:8080/go/to/foo`


Additionally, you can capture request.params values and inject them into the upstream uri value using a similar replacment strategy:
```javascript
server.route({
    method: 'GET',
    path: '/foo/{bar}',
    handler: {
        proxy: {
            uri: 'https://some.upstream.service.com/some/path/to/{bar}'
        }
    }
});
```
**Note** The default variables of `{protocol}`, `{host}`, `{port}`, `{path}` take precedence - it's best to treat those as reserved when naming your own `request.params`.


### Using the `mapUri` and `onResponse` options

Setting both options with custom functions will allow you to map the original request to an upstream service and to processing the response from the upstream service, before sending it to the client. Cannot be used together with `host`, `port`, `protocol`, or `uri`.

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: {
        proxy: {
            mapUri: function (request) {

                console.log('doing some additional stuff before redirecting');
                return {
                    uri: 'https://some.upstream.service.com/'
                };
            },
            onResponse: function (err, res, request, h, settings, ttl) {

                console.log('receiving the response from the upstream.');
                Wreck.read(res, { json: true }, function (err, payload) {

                    console.log('some payload manipulation if you want to.')
                    const response = h.response(payload);
                    response.headers = res.headers;
                    return response;
                });
            }
        }
    }
});

```


### Using a custom http client

By default, `h2o2` uses Wreck to perform requests. A custom http client can be provided by passing a client to `httpClient`, as long as it abides by the [`wreck`](https://github.com/hapijs/wreck) interface. The two functions that `h2o2` utilizes are `request()` and `parseCacheControl()`.

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: {
        proxy: {
            httpClient: {
                request(method, uri, options) {
                    return axios({
                        method,
                        url: 'https://some.upstream.service.com/'
                    })
                }
            }
        }
    }
});
```
