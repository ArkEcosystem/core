import { Container } from "@arkecosystem/core-interfaces";
export declare class PluginRegistrar {
    private container;
    private plugins;
    private options;
    private deregister;
    private failedPlugins;
    constructor(container: Container.IContainer, options?: Record<string, any>);
    /**
     * Set up all available plugins.
     * @return {void}
     */
    setUp(): Promise<void>;
    /**
     * Deregister all plugins.
     * @return {void}
     */
    tearDown(): Promise<void>;
    /**
     * Register a plugin.
     * @param  {String} name
     * @param  {Object} options
     * @return {void}
     */
    private register;
    /**
     * Register a plugin.
     * @param  {Object} plugin
     * @param  {Object} options
     * @return {void}
     */
    private registerWithContainer;
    /**
     * Apply the given options to the defaults of the given plugin.
     *
     * @param  {String} name
     * @param  {Object} defaults
     * @param  {Object} options
     * @return {Object}
     */
    private applyToDefaults;
    /**
     * When the env is used to overwrite options, we get strings even if we
     * expect a number. This is in most cases not desired and leads to side-
     * effects. Here is assumed all numeric strings except blacklisted ones
     * should be treated as numbers.
     * @param {Object} options
     * @return {Object} options
     */
    private castOptions;
    /**
     * Resolve a plugin instance.
     * @param  {(String|Object)} plugin - plugin name or path, or object
     * @return {Object}
     */
    private resolve;
    /**
     * Determine if the given plugin should be registered.
     * @param  {String} name
     * @return {Boolean}
     */
    private shouldBeRegistered;
}
