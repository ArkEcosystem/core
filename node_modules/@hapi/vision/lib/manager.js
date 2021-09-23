'use strict';

const Fs = require('fs');
const Path = require('path');

const Boom = require('@hapi/boom');
const Bounce = require('@hapi/bounce');
const Hoek = require('@hapi/hoek');
const Joi = require('@hapi/joi');

const Schemas = require('./schemas');
const Utils = require('./utils');

// Additional helper modules required in constructor


const internals = {};


internals.defaults = {
    // defaultExtension: '',
    // path: '',
    // relativeTo: '',
    compileOptions: {},
    runtimeOptions: {},
    layout: false,
    layoutKeyword: 'content',
    encoding: 'utf8',
    isCached: true,
    allowAbsolutePaths: false,
    allowInsecureAccess: false,
    // partialsPath: '',
    contentType: 'text/html',
    compileMode: 'sync',
    context: null
};


module.exports = class Manager {

    constructor(server, options) {

        Joi.assert(options, Schemas.manager);

        // Save non-defaults values

        const engines = options.engines;
        const defaultExtension = options.defaultExtension;

        // Clone options

        const defaults = Hoek.applyToDefaults(internals.defaults, options, { shallow: ['engines', 'context'] });
        delete defaults.engines;
        delete defaults.defaultExtension;

        // Prepare manager state

        const extensions = Object.keys(engines);
        Hoek.assert(extensions.length, 'Views manager requires at least one registered extension handler');

        // Private class props

        this._server = server;
        this._context = defaults.context;
        this._engines = {};
        this._defaultExtension = defaultExtension || (extensions.length === 1 ? extensions[0] : '');

        // Load engines

        for (const extension of extensions) {
            const config = engines[extension];
            const engine = {};

            if (typeof config.compile === 'function') {
                engine.module = config;
                engine.config = defaults;
            }
            else {
                Joi.assert(config, Schemas.view);

                engine.module = config.module;
                engine.config = Hoek.applyToDefaults(defaults, config, { shallow: ['module'] });
            }

            engine.suffix = '.' + extension;
            engine.compileFunc = engine.module.compile;

            if (engine.config.compileMode === 'sync') {
                engine.compileFunc = function (str, opt, next) {

                    let compiled = null;
                    try {
                        compiled = engine.module.compile(str, opt);
                    }
                    catch (err) {
                        return next(err);
                    }

                    const renderer = function (context, runtimeOptions, renderNext) {

                        let rendered = null;
                        try {
                            rendered = compiled(context, runtimeOptions);
                        }
                        catch (err) {
                            return renderNext(err);
                        }

                        return renderNext(null, rendered);
                    };

                    return next(null, renderer);
                };
            }

            if (engine.config.isCached) {
                engine.cache = {};
            }

            // When a prepare function is provided, state needs to be initialized before trying to compile and render

            engine.ready = !(engine.module.prepare && typeof engine.module.prepare === 'function');

            // Load partials and helpers

            this._loadPartials(engine);
            this._loadHelpers(engine);

            // Set engine

            this._engines[extension] = engine;
        }
    }

    _loadPartials(engine) {

        if (!engine.config.partialsPath ||
            !engine.module.registerPartial) {

            return;
        }

        const traverse = function (path) {

            let files = [];

            Fs.readdirSync(path).forEach((file) => {

                file = Path.join(path, file);
                const stat = Fs.statSync(file);
                if (stat.isDirectory()) {
                    files = files.concat(traverse(file));
                    return;
                }

                if (Path.basename(file)[0] !== '.' &&
                    Path.extname(file) === engine.suffix) {

                    files.push(file);
                }
            });

            return files;
        };

        const partialsPaths = [].concat(engine.config.partialsPath);

        for (const partialsPath of partialsPaths) {
            const path = internals.path(engine.config.relativeTo, partialsPath);
            const files = traverse(path);
            for (const file of files) {
                const offset = path.slice(-1) === Path.sep ? 0 : 1;
                const name = file.slice(path.length + offset, -engine.suffix.length).replace(/\\/g, '/');
                const src = Fs.readFileSync(file).toString(engine.config.encoding);
                engine.module.registerPartial(name, src);
            }
        }
    }

    _loadHelpers(engine) {

        if (!engine.config.helpersPath ||
            !engine.module.registerHelper) {

            return;
        }

        const helpersPaths = [].concat(engine.config.helpersPath);

        for (const helpersPath of helpersPaths) {
            let path = internals.path(engine.config.relativeTo, helpersPath);
            if (!Path.isAbsolute(path)) {
                path = Path.join(process.cwd(), path);
            }

            Fs.readdirSync(path).forEach((file) => {

                file = Path.join(path, file);
                const stat = Fs.statSync(file);
                if (stat.isDirectory() ||
                    Path.basename(file).startsWith('.') ||
                    !Object.keys(require.extensions).includes(Path.extname(file))) {
                    return;
                }

                try {
                    if (!engine.config.isCached) {
                        this._bustRequireCache(file);
                    }

                    const required = require(file);

                    const offset = path.slice(-1) === Path.sep ? 0 : 1;
                    const name = file.slice(path.length + offset, -Path.extname(file).length);
                    const helper = required[name] || required.default || required;
                    if (typeof helper === 'function') {
                        engine.module.registerHelper(name, helper);
                    }
                }
                catch (err) {
                    this._server.log(['vision', 'helper', 'load', 'error'], { file, err });
                }
            });
        }
    }

    async _prepare(template, options) {

        options = options || {};

        const fileExtension = Path.extname(template).slice(1);
        const extension = fileExtension || this._defaultExtension;
        if (!extension) {
            throw Boom.badImplementation('Unknown extension and no defaultExtension configured for view template: ' + template);
        }

        const engine = this._engines[extension];
        if (!engine) {
            throw Boom.badImplementation('No view engine found for file: ' + template);
        }

        template = template + (fileExtension ? '' : engine.suffix);


        if (!engine.ready) {
            await this._prepareEngine(engine);
        }

        return this._prepareTemplates(template, engine, options);
    }

    _prepareEngine(engine) {

        // _prepareEngine can only be invoked when the prepare function is defined

        return new Promise((resolve, reject) => {

            try {
                return engine.module.prepare(engine.config, (err) => {

                    if (err) {
                        return reject(err);
                    }

                    engine.ready = true;
                    return resolve();
                });
            }
            catch (err) {
                return reject(err);
            }
        });
    }

    async _prepareTemplates(template, engine, options) {

        const compiled = {
            settings: Hoek.applyToDefaults(engine.config, options)
        };

        const templatePath = await this._path(template, compiled.settings, false);

        if (!engine.config.isCached) {
            this._loadPartials(engine);
            this._loadHelpers(engine);
        }

        const compiledTemplate = await this._compile(templatePath, engine, compiled.settings);
        compiled.template = compiledTemplate;

        if (compiled.settings.layout) {
            const layoutPath = await this._path((compiled.settings.layout === true ? 'layout' : compiled.settings.layout) + engine.suffix, compiled.settings, true);
            compiled.layout = await this._compile(layoutPath, engine, compiled.settings);
        }

        return compiled;
    }

    async _path(template, settings, isLayout) {

        // Validate path

        const isAbsolutePath = Path.isAbsolute(template);
        const isInsecurePath = template.match(/\.\.\//g);

        if (!settings.allowAbsolutePaths &&
            isAbsolutePath) {

            throw Boom.badImplementation('Absolute paths are not allowed in views');
        }

        if (!settings.allowInsecureAccess &&
            isInsecurePath) {

            throw Boom.badImplementation('View paths cannot lookup templates outside root path (path includes one or more \'../\')');
        }

        // Resolve path and extension

        let paths;
        if (isAbsolutePath) {
            paths = [template];
        }
        else {
            paths = [].concat((isLayout && settings.layoutPath) || settings.path);

            for (let i = 0; i < paths.length; ++i) {
                paths[i] = internals.path(settings.relativeTo, paths[i], template);
            }
        }

        for (const path of paths) {
            try {
                const stats = await Utils.stat(path);
                if (stats.isFile()) {
                    return path;
                }
            }
            catch (err) {
                Bounce.rethrow(err, 'system');
            }
        }

        throw Boom.badImplementation('View file not found: `' + template + '`. Locations searched: [' + paths.join(',') + ']');
    }

    async _compile(template, engine, settings) {

        if (engine.cache &&
            engine.cache[template]) {

            return engine.cache[template];
        }

        settings.compileOptions.filename = template;            // Pass the template to Pug via this copy of compileOptions

        // Read file

        try {
            var data = await Utils.readFile(template, { encoding: settings.encoding });
        }
        catch (err) {
            throw Boom.badImplementation('Failed to read view file: ' + template);
        }

        return new Promise((resolve, reject) => {

            engine.compileFunc(data, settings.compileOptions, (err, compiled) => {

                if (err) {
                    reject(Boom.boomify(err));
                    return;
                }

                if (engine.cache) {
                    engine.cache[template] = compiled;
                }

                resolve(compiled);
            });
        });
    }

    _render(compiled, context, request) {

        if (this._context) {
            let base = typeof this._context === 'function' ? this._context(request) : this._context;
            if (context) {
                base = Object.assign({}, base);             // Shallow cloned
                const keys = Object.keys(context);
                for (let i = 0; i < keys.length; ++i) {
                    const key = keys[i];
                    base[key] = context[key];
                }
            }

            context = base;
        }

        context = context || {};

        if (compiled.layout &&
            context.hasOwnProperty(compiled.settings.layoutKeyword)) {

            throw Boom.badImplementation('settings.layoutKeyword conflict', { context, keyword: compiled.settings.layoutKeyword });
        }

        return new Promise((resolve, reject) => {

            compiled.template(context, compiled.settings.runtimeOptions, (err, renderedContent) => {

                if (err) {
                    reject(Boom.badImplementation(err.message, err));
                    return;
                }

                // No layout

                if (!compiled.layout) {
                    resolve(renderedContent);
                    return;
                }

                // With layout

                context[compiled.settings.layoutKeyword] = renderedContent;
                compiled.layout(context, compiled.settings.runtimeOptions, (err, renderedWithLayout) => {

                    delete context[compiled.settings.layoutKeyword];

                    if (err) {
                        reject(Boom.badImplementation(err.message, err));
                        return;
                    }

                    resolve(renderedWithLayout);
                });
            });
        });
    }

    _response(template, context, options, request) {

        Joi.assert(options, Schemas.viewOverride);

        const source = { manager: this, template, context, options };
        return request.generateResponse(source, { variety: 'view', marshal: internals.marshal, prepare: internals.prepare });
    }

    _bustRequireCache(path) {

        const modulekey = require.resolve(path);
        const mod = require.cache[modulekey];

        if (mod) {
            // Remove module from require cache
            delete require.cache[modulekey];

            // Remove module references from parent module
            mod.parent.children = mod.parent.children.filter((el) => el !== mod);
        }
    }

    getEngine(ext) {

        let engine;

        if (!ext) {
            // The _defaultExtension is set if there is a single extension in _engines
            if (!this._defaultExtension) {
                throw new Error('Must provide an extension or set defaultExtension in manager options');
            }

            engine = this._engines[this._defaultExtension];
        }
        else {
            engine = this._engines[ext];
            if (!engine) {
                throw new Error(`Extension "${ext}" not found on manager`);
            }
        }

        return engine;
    }

    clearCache(template, engine) {

        if (!template) {
            throw new Error('template is required');
        }

        // The _defaultExtension is set if there is a single extension in _engines
        if (!engine && !Path.extname(template) && !this._defaultExtension) {
            throw new Error('Must pass the engine, have a single engine on the manager, have an extension on the template name, or set defaultExtension on manager options');
        }

        const extension = Path.extname(template) ? Path.extname(template).slice(1) : this._defaultExtension;
        engine = engine || this.getEngine(extension);

        const templateWithSuffix = Path.extname(template) ? template : (template + engine.suffix);
        const templateFullPath = internals.path(engine.config.relativeTo, engine.config.path, templateWithSuffix);

        if (!engine.cache[templateFullPath]) {
            this._server.log(['vision', 'cache', 'clear', 'error'], { template: templateFullPath });
        }

        delete engine.cache[templateFullPath];
    }

    registerHelper(name, helper) {

        Object.keys(this._engines).forEach((extension) => {

            const engine = this._engines[extension];

            if (typeof engine.module.registerHelper === 'function') {
                engine.module.registerHelper(name, helper);
            }
        });
    }

    async render(filename, context, options, request) {

        const compiled = await this._prepare(filename, options);
        return this._render(compiled, context, request);
    }
};


internals.path = function (base, path, file) {

    if (path &&
        Path.isAbsolute(path)) {

        return Path.join(path, file || '');
    }

    return Path.join(base || '', path || '', file || '');
};


internals.marshal = async function (response) {

    const manager = response.source.manager;
    const rendered = await manager._render(response.source.compiled, response.source.context, response.request);
    const config = response.source.compiled.settings;

    if (!response.headers['content-type']) {
        response.type(config.contentType);
    }

    response.encoding(config.encoding);
    return rendered;
};


internals.prepare = async function (response) {

    const manager = response.source.manager;
    response.source.compiled = await manager._prepare(response.source.template, response.source.options);
    return response;
};
