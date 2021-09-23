# hapi-rate-limit

[![Build Status](https://travis-ci.org/wraithgar/hapi-rate-limit.svg?branch=master)](http://travis-ci.org/wraithgar/hapi-rate-limit)
[![Greenkeeper badge](https://badges.greenkeeper.io/wraithgar/hapi-rate-limit.svg)](https://greenkeeper.io/)

Lead Maintainer: [Gar](https://github.com/wraithgar)

## Introduction

**hapi-rate-limit** is a plugin for [hapi](http://hapijs.com) that enables rate limiting.

## Use

```javascript
const Hapi = require('hapi');

const server = Hapi.server({});
server.register({
    plugin: require('hapi-rate-limit'),
    options: {}
});
```

## Options

Defaults are given here

- `enabled`: `true` whether or not rate limiting is enabled at all. Set this to `false` in a route's config to bypass all rate limiting for that route
- `userLimit`: `300` number of total requests a user can make per period.  Set to `false` to disable limiting requests per user.
- `userCache`: Object with the following properties:
    - `segment`: `hapi-rate-limit-user` Name of the cache segment to use for storing user rate limit info
    - `expiresIn`: `600000` Time (in milliseconds) of period for `userLimit`
    - `cache`: Optional cache name configured in server.cache. Defaults to the default cache.
- `userAttribute`: `id` credentials attribute to use when determining distinct authenticated users
- `userWhitelist`: `[]` array of users (as defined by `userAttribute` for whom to bypass rate limiting.  This is only applied to authenticated users, for ip whitelisting use `ipWhitelist`.
- `addressOnly`: `false` if true, only consider user address when determining distinct authenticated users
- `pathLimit`: `50` number of total requests that can be made on a given path per period.  Set to `false` to disable limiting requests per path.
- `pathCache`: Object with the following properties:
	- `segment`: `hapi-rate-limit-path` Name of the cache segment to use for storing path rate limit info
	- `expiresIn`: `60000` Time (in milliseconds) of period for `pathLimit`
    - `cache`: Optional cache name configured in server.cache. Defaults to the default cache.
- `userPathLimit`: `false` number of total requests that can be made on a given path per user per period.  Set to `false` to disable limiting requests per path per user.
- `userPathCache`: Object with the following properties:
	- `segment`: `hapi-rate-limit-userPath` Name of the cache segment to use for storing userPath rate limit info
	- `expiresIn`: `60000` Time (in milliseconds) of period for `userPathLimit`
    - `cache`: Optional cache name configured in server.cache. Defaults to the default cache.
- `headers`: `true` Whether or not to include headers in responses
- `ipWhitelist`: `[]` array of IPs for whom to bypass rate limiting.  Note that a whitelisted IP would also bypass restrictions an authenticated user would otherwise have.
- `trustProxy`: `false` If true, honor the `X-Forwarded-For` header.  See note below.
- `getIpFromProxyHeader`: `undefined` a function which will extract the remote address from the `X-Forwarded-For` header. The default implementation takes the first entry.

## Users

A user is considered a single `remoteAddress` for routes that are unauthenticated.  On authenticated routes it is the `userAtribute` (default `id`) of the authenticated user.

If `trustProxy` is true, the address from the `X-Forwarded-For` header will be use instead of `remoteAddress`, if present.

If `trustProxy` is true and `getIpFromProxyHeader` is not defined, the address will be determined using the first entry in the `X-Forwarded-For` header.

## Proxies

If you set `trustProxy` to true, make sure that your proxy server is the only thing that can access the server, and be sure to configure your proxy to strip all incoming `X-Forwarded-For` headers.

For example if you were using [haproxy](http://www.haproxy.org) you would add `reqidel ^X-Forwarded-For` to your config.

Failure to do this would allow anyone to spoof that header to bypass your rate limiting.

## Response Headers

The following headers will be included in server responses if their respective limits are enabled

- `x-ratelimit-pathlimit`: Will equal `pathLimit`
- `x-ratelimit-pathremaining`: Remaining number of requests path has this - period
- `x-ratelimit-pathreset`: Time (in milliseconds) until reset of `pathLimit` period
- `x-ratelimit-userlimit`: Will equal `userLimit`
- `x-ratelimit-userremaining`: Remaining number of requests user has this period
- `x-ratelimit-userreset`: Time (in milliseconds) until reset of `userLimit` period
- `x-ratelimit-userpathlimit`: Will equal `userPathLimit`
- `x-ratelimit-userpathremaining`: Remaining number of requests user has this period for this path
- `x-ratelimit-userpathreset`: Time (in milliseconds) until reset of `userPathLimit` period

## Per-route settings

All of the settings (except for `userLimit` and `userCache`) can be overridden in your route's config.

For instance, to disable `pathLimit` for a route you would add this to its `config` attribute

```javascript
    plugins: {
        'hapi-rate-limit': {
            pathLimit: false
        }
    }
```

To disable all rate limiting for a route you woul add this to its `config` attribute

```javascript
    plugins: {
        'hapi-rate-limit': {
            enabled: false
        }
    }
```

##

License: MIT
