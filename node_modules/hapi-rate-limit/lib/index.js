'use strict';

const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const Pkg = require('../package.json');

const internals = {};

internals.pluginName = Pkg.name;

internals.schema = Joi.object({
    enabled: Joi.boolean().default(true),
    addressOnly: Joi.boolean().default(false),
    headers: Joi.boolean().default(true),
    ipWhitelist: Joi.array().default([]),
    pathCache: Joi.object({
        getDecoratedValue: Joi.boolean().default(true),
        cache: Joi.string().optional(),
        segment: Joi.string().default(`${internals.pluginName}-path`),
        expiresIn: Joi.number().default(1 * 60 * 1000) //1 minute
    }).default(),
    pathLimit: Joi.alternatives()
        .try(Joi.boolean(), Joi.number())
        .default(50),
    trustProxy: Joi.boolean().default(false),
    getIpFromProxyHeader: Joi.func().default(null),
    userAttribute: Joi.string().default('id'),
    userCache: Joi.object({
        getDecoratedValue: Joi.boolean().default(true),
        cache: Joi.string().optional(),
        segment: Joi.string().default(`${internals.pluginName}-user`),
        expiresIn: Joi.number().default(10 * 60 * 1000) //10 minutes
    }).default(),
    userLimit: Joi.alternatives()
        .try(Joi.boolean(), Joi.number())
        .default(300),
    userWhitelist: Joi.array().default([]),
    userPathCache: Joi.object({
        getDecoratedValue: Joi.boolean().default(true),
        cache: Joi.string().optional(),
        segment: Joi.string().default(`${internals.pluginName}-userPath`),
        expiresIn: Joi.number().default(1 * 60 * 1000) //1 minute
    }).default(),
    userPathLimit: Joi.alternatives()
        .try(Joi.boolean(), Joi.number())
        .default(false)
});

internals.getUser = function getUser(request, settings) {
    if (
        request.auth.isAuthenticated &&
        Object.prototype.hasOwnProperty.call(
            request.auth.credentials,
            settings.userAttribute
        )
    ) {
        const user = request.auth.credentials[
            settings.userAttribute
        ].toString();
        return user;
    }
};

internals.getIP = function getIP(request, settings) {
    let ip;

    if (settings.trustProxy && request.headers['x-forwarded-for']) {
        if (settings.getIpFromProxyHeader) {
            ip = settings.getIpFromProxyHeader(
                request.headers['x-forwarded-for']
            );
        } else {
            const ips = request.headers['x-forwarded-for'].split(',');
            ip = ips[0];
        }
    }

    if (ip === undefined) {
        ip = request.info.remoteAddress;
    }

    return ip;
};

internals.pathCheck = async function(pathCache, request, settings) {
    const path = request.path;
    const plugin = request.plugins[internals.pluginName];

    if (settings.pathLimit === false) {
        plugin.pathLimit = false;
        return { remaining: 1 };
    }

    const { value, cached } = await pathCache.get(path);
    let count;
    let ttl = settings.pathCache.expiresIn;

    /* $lab:coverage:off$ */
    if (value === null || cached.isStale) {
        /* $lab:coverage:on$ */
        count = 1;
    } else {
        count = value + 1;
        ttl = cached.ttl;
    }

    const remaining = settings.pathLimit - count;

    await pathCache.set(path, count, ttl);

    plugin.pathLimit = settings.pathLimit;
    plugin.pathRemaining = remaining;
    plugin.pathReset = Date.now() + ttl;

    return { count, remaining, reset: settings.pathCache.expiresIn };
};

internals.userCheck = async function(userCache, request, settings) {
    const plugin = request.plugins[internals.pluginName];
    const ip = internals.getIP(request, settings);
    let user = internals.getUser(request, settings);
    if (
        settings.ipWhitelist.indexOf(ip) > -1 ||
        (user && settings.userWhitelist.indexOf(user) > -1) ||
        settings.userLimit === false
    ) {
        plugin.userLimit = false;
        return { remaining: 1 };
    }

    if (settings.addressOnly || user === undefined) {
        user = ip;
    }

    const { value, cached } = await userCache.get(user);

    let count;
    let ttl = settings.userCache.expiresIn;

    /* $lab:coverage:off$ */
    if (value === null || cached.isStale) {
        /* $lab:coverage:on$ */
        count = 1;
    } else {
        count = value + 1;
        ttl = cached.ttl;
    }

    const remaining = settings.userLimit - count;

    await userCache.set(user, count, ttl);

    plugin.userLimit = settings.userLimit;
    plugin.userRemaining = remaining;
    plugin.userReset = Date.now() + ttl;

    return { count, remaining, reset: ttl };
};

internals.userPathCheck = async function(userPathCache, request, settings) {
    const ip = internals.getIP(request, settings);
    const plugin = request.plugins[internals.pluginName];
    let user = internals.getUser(request, settings);
    const path = request.path;

    if (
        settings.ipWhitelist.indexOf(ip) > -1 ||
        (user && settings.userWhitelist.indexOf(user) > -1) ||
        settings.userPathLimit === false
    ) {
        plugin.userPathLimit = false;
        return { remaining: 1 };
    }

    if (settings.addressOnly || user === undefined) {
        user = ip;
    }

    const userPath = user + ':' + path;

    const { value, cached } = await userPathCache.get(userPath);

    let count;
    let ttl = settings.userPathCache.expiresIn;

    /* $lab:coverage:off$ */
    if (value === null || cached.isStale) {
        /* $lab:coverage:on$ */
        count = 1;
    } else {
        count = value + 1;
        ttl = cached.ttl;
    }

    const remaining = settings.userPathLimit - count;

    await userPathCache.set(userPath, count, ttl);

    plugin.userPathLimit = settings.userPathLimit;
    plugin.userPathRemaining = remaining;
    plugin.userPathReset = Date.now() + ttl;

    return { count, remaining, reset: ttl };
};

const register = function(plugin, options) {
    const settings = Joi.attempt(Object.assign({}, options), internals.schema);

    //We call toString on the user attribute in getUser, so we have to do it here too.
    settings.userWhitelist = settings.userWhitelist.map(user =>
        user.toString()
    );

    const userCache = plugin.cache(settings.userCache);
    const pathCache = plugin.cache(settings.pathCache);
    const userPathCache = plugin.cache(settings.userPathCache);

    plugin.ext('onPostAuth', async (request, h) => {
        const routeSettings =
            request.route.settings.plugins[internals.pluginName] || {};

        delete routeSettings.userCache;

        if (routeSettings.userLimit !== false) {
            delete routeSettings.userLimit;
        }

        const requestSettings = { ...settings, ...routeSettings };

        request.plugins[internals.pluginName] = { requestSettings };

        if (requestSettings.enabled === false) {
            return h.continue;
        }

        const [path, user, userPath] = await Promise.all([
            internals.pathCheck(pathCache, request, requestSettings),
            internals.userCheck(userCache, request, requestSettings),
            internals.userPathCheck(userPathCache, request, requestSettings)
        ]);

        if (
            path.remaining < 0 ||
            user.remaining < 0 ||
            userPath.remaining < 0
        ) {
            const error = Boom.tooManyRequests('Rate limit exceeded');
            if (
                requestSettings.pathLimit !== false &&
                requestSettings.headers !== false
            ) {
                error.output.headers['X-RateLimit-PathLimit'] =
                    request.plugins[internals.pluginName].pathLimit;
                error.output.headers['X-RateLimit-PathRemaining'] =
                    request.plugins[internals.pluginName].pathRemaining;
                error.output.headers['X-RateLimit-PathReset'] =
                    request.plugins[internals.pluginName].pathReset;
            }

            if (
                requestSettings.userPathLimit !== false &&
                requestSettings.headers !== false
            ) {
                error.output.headers['X-RateLimit-UserPathLimit'] =
                    request.plugins[internals.pluginName].userPathLimit;
                error.output.headers['X-RateLimit-UserPathRemaining'] =
                    request.plugins[internals.pluginName].userPathRemaining;
                error.output.headers['X-RateLimit-UserPathReset'] =
                    request.plugins[internals.pluginName].userPathReset;
            }

            return error; //? or h.response(err0r);
        }

        return h.continue;
    });

    plugin.ext('onPreResponse', (request, h) => {
        const response = request.response;
        const requestPlugin = request.plugins[internals.pluginName];
        if (!requestPlugin) {
            return h.continue;
        }

        const requestSettings = requestPlugin.requestSettings;

        if (
            !response.isBoom &&
            requestSettings.pathLimit !== false &&
            requestSettings.headers !== false
        ) {
            response.headers['X-RateLimit-PathLimit'] = requestPlugin.pathLimit;
            response.headers['X-RateLimit-PathRemaining'] =
                requestPlugin.pathRemaining;
            response.headers['X-RateLimit-PathReset'] = requestPlugin.pathReset;
        }

        if (
            !response.isBoom &&
            requestSettings.userPathLimit !== false &&
            requestSettings.headers !== false
        ) {
            response.headers['X-RateLimit-UserPathLimit'] =
                requestPlugin.userPathLimit;
            response.headers['X-RateLimit-UserPathRemaining'] =
                requestPlugin.userPathRemaining;
            response.headers['X-RateLimit-UserPathReset'] =
                requestPlugin.userPathReset;
        }

        if (
            requestSettings.userLimit !== false &&
            requestSettings.headers !== false
        ) {
            if (response.isBoom) {
                response.output.headers['X-RateLimit-UserLimit'] =
                    requestPlugin.userLimit;
                response.output.headers['X-RateLimit-UserRemaining'] =
                    requestPlugin.userRemaining;
                response.output.headers['X-RateLimit-UserReset'] =
                    requestPlugin.userReset;
            } else {
                response.headers['X-RateLimit-UserLimit'] =
                    requestPlugin.userLimit;
                response.headers['X-RateLimit-UserRemaining'] =
                    requestPlugin.userRemaining;
                response.headers['X-RateLimit-UserReset'] =
                    requestPlugin.userReset;
            }
        }

        return h.continue;
    });
};

module.exports = {
    register,
    pkg: Pkg
};
