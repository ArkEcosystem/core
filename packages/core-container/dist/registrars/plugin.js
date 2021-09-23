"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hoek_1 = __importDefault(require("@hapi/hoek"));
const awilix_1 = require("awilix");
const lodash_isstring_1 = __importDefault(require("lodash.isstring"));
const semver_1 = __importDefault(require("semver"));
class PluginRegistrar {
    constructor(container, options = {}) {
        this.container = container;
        this.plugins = container.config.get("plugins");
        this.options = this.castOptions(options);
        this.deregister = [];
        this.failedPlugins = {};
    }
    /**
     * Set up all available plugins.
     * @return {void}
     */
    async setUp() {
        for (const [name, options] of Object.entries(this.plugins)) {
            await this.register(name, options);
            if ((this.options.exit && this.options.exit === name) || this.container.shuttingDown) {
                break;
            }
        }
        const failedPlugins = Object.keys(this.failedPlugins).length;
        if (failedPlugins > 0) {
            const logger = this.container.resolvePlugin("logger");
            if (logger) {
                logger.warn(`Failed to load ${failedPlugins} optional plugins.`);
                for (const [name, error] of Object.entries(this.failedPlugins)) {
                    logger.warn(`Plugin '${name}': ${error.message}`);
                }
            }
        }
    }
    /**
     * Deregister all plugins.
     * @return {void}
     */
    async tearDown() {
        for (const plugin of this.deregister.reverse()) {
            await plugin.plugin.deregister(this.container, plugin.options);
        }
    }
    /**
     * Register a plugin.
     * @param  {String} name
     * @param  {Object} options
     * @return {void}
     */
    async register(name, options = {}) {
        try {
            if (!this.shouldBeRegistered(name)) {
                return;
            }
            if (this.plugins[name]) {
                options = hoek_1.default.applyToDefaults(this.plugins[name], options);
            }
            return this.registerWithContainer(name, options);
        }
        catch (error) {
            this.failedPlugins[name] = error;
        }
    }
    /**
     * Register a plugin.
     * @param  {Object} plugin
     * @param  {Object} options
     * @return {void}
     */
    async registerWithContainer(plugin, options = {}) {
        let item;
        try {
            item = this.resolve(plugin);
        }
        catch (error) {
            this.failedPlugins[plugin] = error;
            return;
        }
        if (!item.plugin.register) {
            return;
        }
        if (item.plugin.extends) {
            await this.registerWithContainer(item.plugin.extends);
        }
        if (item.plugin.depends && !this.failedPlugins[item.plugin.depends]) {
            await this.registerWithContainer(item.plugin.depends, this.plugins[item.plugin.depends]);
        }
        const name = item.plugin.name || item.plugin.pkg.name;
        const version = item.plugin.version || item.plugin.pkg.version;
        const defaults = item.plugin.defaults || item.plugin.pkg.defaults;
        const alias = item.plugin.alias || item.plugin.pkg.alias;
        if (this.container.has(alias) || this.container.has(name)) {
            return;
        }
        if (!semver_1.default.valid(version)) {
            throw new Error(
            // tslint:disable-next-line:max-line-length
            `The plugin "${name}" provided an invalid version "${version}". Please check https://semver.org/ and make sure you follow the spec.`);
        }
        options = this.applyToDefaults(name, defaults, options);
        this.container.register(`pkg.${alias || name}.opts`, awilix_1.asValue(options));
        try {
            plugin = await item.plugin.register(this.container, options);
            this.container.register(alias || name, awilix_1.asValue({
                name,
                version,
                plugin,
            }));
            this.plugins[name] = options;
            if (item.plugin.deregister) {
                this.deregister.push({ plugin: item.plugin, options });
            }
        }
        catch (error) {
            if (item.plugin.required) {
                this.container.forceExit(`Failed to load required plugin '${name}'`, error);
            }
            else {
                this.failedPlugins[name] = error;
            }
        }
    }
    /**
     * Apply the given options to the defaults of the given plugin.
     *
     * @param  {String} name
     * @param  {Object} defaults
     * @param  {Object} options
     * @return {Object}
     */
    applyToDefaults(name, defaults, options) {
        if (defaults) {
            options = hoek_1.default.applyToDefaults(defaults, options);
        }
        if (this.options.options && this.options.options[name]) {
            options = hoek_1.default.applyToDefaults(options, this.options.options[name]);
        }
        return this.castOptions(options);
    }
    /**
     * When the env is used to overwrite options, we get strings even if we
     * expect a number. This is in most cases not desired and leads to side-
     * effects. Here is assumed all numeric strings except blacklisted ones
     * should be treated as numbers.
     * @param {Object} options
     * @return {Object} options
     */
    castOptions(options) {
        const blacklist = [];
        const regex = new RegExp(/^\d+$/);
        for (const key of Object.keys(options)) {
            const value = options[key];
            if (lodash_isstring_1.default(value) && !blacklist.includes(key) && regex.test(value)) {
                options[key] = +value;
            }
        }
        return options;
    }
    /**
     * Resolve a plugin instance.
     * @param  {(String|Object)} plugin - plugin name or path, or object
     * @return {Object}
     */
    resolve(plugin) {
        let item = require(plugin);
        if (!item.plugin) {
            item = { plugin: item };
        }
        return item;
    }
    /**
     * Determine if the given plugin should be registered.
     * @param  {String} name
     * @return {Boolean}
     */
    shouldBeRegistered(name) {
        let register = true;
        if (this.options.include) {
            register = this.options.include.includes(name);
        }
        if (this.options.exclude) {
            register = !this.options.exclude.includes(name);
        }
        return register;
    }
}
exports.PluginRegistrar = PluginRegistrar;
//# sourceMappingURL=plugin.js.map