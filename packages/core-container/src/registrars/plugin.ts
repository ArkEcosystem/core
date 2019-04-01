import { Container } from "@arkecosystem/core-interfaces";
import { asValue } from "awilix";
import Hoek from "hoek";
import isString from "lodash.isstring";
import semver from "semver";

export class PluginRegistrar {
    private container: any;
    private plugins: any;
    private options: any;
    private deregister: any;

    constructor(container: Container.IContainer, options: Record<string, any> = {}) {
        this.container = container;
        this.plugins = container.config.get("plugins");
        this.options = this.__castOptions(options);
        this.deregister = [];
    }

    /**
     * Set up all available plugins.
     * @return {void}
     */
    public async setUp() {
        for (const [name, options] of Object.entries(this.plugins)) {
            await this.register(name, options);

            if ((this.options.exit && this.options.exit === name) || this.container.shuttingDown) {
                break;
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
    public async register(name, options = {}) {
        if (!this.__shouldBeRegistered(name)) {
            return;
        }

        if (this.plugins[name]) {
            options = Hoek.applyToDefaults(this.plugins[name], options);
        }

        return this.__registerWithContainer(name, options);
    }

    /**
     * Register a plugin.
     * @param  {Object} plugin
     * @param  {Object} options
     * @return {void}
     */
    public async __registerWithContainer(plugin, options = {}) {
        const item: any = this.__resolve(plugin);

        if (!item.plugin.register) {
            return;
        }

        if (item.plugin.extends) {
            await this.__registerWithContainer(item.plugin.extends);
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

        options = this.__applyToDefaults(name, defaults, options);

        plugin = await item.plugin.register(this.container, options || {});
        this.container.register(
            alias || name,
            asValue({
                name,
                version,
                plugin,
                options,
            }),
        );

        if (item.plugin.deregister) {
            this.deregister.push({ plugin: item.plugin, options });
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
    public __applyToDefaults(name, defaults, options) {
        if (defaults) {
            options = Hoek.applyToDefaults(defaults, options);
        }

        if (this.options.options && this.options.options[name]) {
            options = Hoek.applyToDefaults(options, this.options.options[name]);
        }

        return this.__castOptions(options);
    }

    /**
     * When the env is used to overwrite options, we get strings even if we
     * expect a number. This is in most cases not desired and leads to side-
     * effects. Here is assumed all numeric strings except blacklisted ones
     * should be treated as numbers.
     * @param {Object} options
     * @return {Object} options
     */
    public __castOptions(options) {
        const blacklist: any = [];
        const regex = new RegExp(/^\d+$/);

        Object.keys(options).forEach(key => {
            const value = options[key];
            if (isString(value) && !blacklist.includes(key) && regex.test(value)) {
                options[key] = +value;
            }
        });

        return options;
    }

    /**
     * Resolve a plugin instance.
     * @param  {(String|Object)} plugin - plugin name or path, or object
     * @return {Object}
     */
    public __resolve(plugin) {
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
    public __shouldBeRegistered(name) {
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
