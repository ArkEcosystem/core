import { Container, Logger } from "@arkecosystem/core-interfaces";
import Hoek from "@hapi/hoek";
import { asValue } from "awilix";
import isString from "lodash.isstring";
import semver from "semver";

export class PluginRegistrar {
    private container: Container.IContainer;
    private plugins: any;
    private options: any;
    private deregister: any;
    private failedPlugins: Record<string, Error>;

    constructor(container: Container.IContainer, options: Record<string, any> = {}) {
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
    public async setUp() {
        for (const onlyOptions of [true, false]) {
            for (const [name, options] of Object.entries(this.plugins)) {
                await this.register(name, options, onlyOptions);

                if ((this.options.exit && this.options.exit === name) || this.container.shuttingDown) {
                    break;
                }
            }
        }

        const failedPlugins: number = Object.keys(this.failedPlugins).length;
        if (failedPlugins > 0) {
            const logger = this.container.resolvePlugin<Logger.ILogger>("logger");
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
    public async tearDown() {
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
    private async register(name, options = {}, onlyOptions: boolean = false) {
        try {
            if (!this.shouldBeRegistered(name)) {
                return;
            }

            if (this.plugins[name]) {
                options = Hoek.applyToDefaults(this.plugins[name], options);
            }

            return this.registerWithContainer(name, options, onlyOptions);
        } catch (error) {
            this.failedPlugins[name] = error;
        }
    }

    /**
     * Register a plugin.
     * @param  {Object} plugin
     * @param  {Object} options
     * @return {void}
     */
    private async registerWithContainer(plugin, options = {}, onlyOptions: boolean = false) {
        let item: any;
        try {
            item = this.resolve(plugin);
        } catch (error) {
            if (!onlyOptions) {
                this.failedPlugins[plugin] = error;
            }

            return;
        }

        if (!item.plugin.register) {
            return;
        }

        if (item.plugin.extends && !onlyOptions) {
            await this.registerWithContainer(item.plugin.extends);
        }

        const name = item.plugin.name || item.plugin.pkg.name;
        const version = item.plugin.version || item.plugin.pkg.version;
        const defaults = item.plugin.defaults || item.plugin.pkg.defaults;
        const alias = item.plugin.alias || item.plugin.pkg.alias;

        if (!semver.valid(version)) {
            throw new Error(
                // tslint:disable-next-line:max-line-length
                `The plugin "${name}" provided an invalid version "${version}". Please check https://semver.org/ and make sure you follow the spec.`,
            );
        }

        options = this.applyToDefaults(name, defaults, options);

        this.container.register(`pkg.${alias || name}.opts`, asValue(options));

        if (onlyOptions) {
            return;
        }

        try {
            plugin = await item.plugin.register(this.container, options);

            this.container.register(
                alias || name,
                asValue({
                    name,
                    version,
                    plugin,
                }),
            );

            this.plugins[name] = options;

            if (item.plugin.deregister) {
                this.deregister.push({ plugin: item.plugin, options });
            }
        } catch (error) {
            console.log(error);
            if (item.plugin.required) {
                this.container.forceExit(`Failed to load required plugin '${name}'`, error);
            } else {
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
    private applyToDefaults(name, defaults, options) {
        if (defaults) {
            options = Hoek.applyToDefaults(defaults, options);
        }

        if (this.options.options && this.options.options[name]) {
            options = Hoek.applyToDefaults(options, this.options.options[name]);
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
    private castOptions(options) {
        const blacklist: any = [];
        const regex = new RegExp(/^\d+$/);

        for (const key of Object.keys(options)) {
            const value = options[key];
            if (isString(value) && !blacklist.includes(key) && regex.test(value)) {
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
    private resolve(plugin) {
        let item: any = require(plugin);

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
    private shouldBeRegistered(name) {
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
