'use strict';

const Joi = require('@hapi/joi');


const internals = {};


// Root schemas

exports.handler = Joi.alternatives([
    Joi.string(),
    Joi.object({
        template: Joi.string(),
        context: Joi.object(),
        options: Joi.object()
    })
]);


// Manager schemas

exports.viewOverride = Joi.object({
    path: [Joi.array().items(Joi.string()), Joi.string()],
    relativeTo: Joi.string(),
    compileOptions: Joi.object(),
    runtimeOptions: Joi.object(),
    layout: Joi.string().allow(false, true),
    layoutKeyword: Joi.string(),
    layoutPath: [Joi.array().items(Joi.string()), Joi.string()],
    encoding: Joi.string(),
    allowAbsolutePaths: Joi.boolean(),
    allowInsecureAccess: Joi.boolean(),
    contentType: Joi.string()
});


exports.viewBase = exports.viewOverride.keys({
    partialsPath: [Joi.array().items(Joi.string()), Joi.string()],
    helpersPath: [Joi.array().items(Joi.string()), Joi.string()],
    isCached: Joi.boolean(),
    compileMode: Joi.string().valid('sync', 'async'),
    defaultExtension: Joi.string()
});


exports.manager = exports.viewBase.keys({
    engines: Joi.object().required(),
    context: [Joi.object(), Joi.func()]
});


exports.view = exports.viewBase.keys({
    module: Joi.object({
        compile: Joi.func().required()
    })
        .options({ allowUnknown: true })
        .required()
});
