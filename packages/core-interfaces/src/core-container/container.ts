import { Resolver } from "awilix";

export interface PluginDescriptor {
    alias: string;
    pkg: any;
    defaults?: any;
    extends?: string;
    register(container: IContainer, options?: IPluginOptions): Promise<any>;
    deregister?(container: IContainer, options?: any): Promise<void>;
}

type PluginOptionValue = string | number | boolean | object;

export interface IPluginOptions {
    [key: string]: PluginOptionValue | PluginOptionValue[];
}

export interface PluginConfig<T> {
    name: string;
    version: string;
    options: IPluginOptions;
    plugin: T;
}

export interface IContainer {
    silentShutdown: boolean;

    isReady: boolean;

    setUp(version: string, variables: any, options?: any): Promise<void>;

    getConfig(): any;
    /**
     * Tear down the app.
     * @return {Promise}
     */
    tearDown(): Promise<void>;

    /**
     * Add a new registration.
     */
    register<T>(name: string, resolver: Resolver<T>): this;

    /**
     * Resolve a registration.
     * @param  {string} key
     * @return {Object}
     * @throws {Error}
     */
    resolve<T = any>(key: any): T;

    /**
     * Resolve a plugin.
     * @param  {string} key
     * @return {Object}
     * @throws {Error}
     */
    resolvePlugin<T = any>(key: any): T;

    /**
     * Resolve the options of a plugin. Available before a plugin mounts.
     * @param  {string} key
     * @return {Object}
     * @throws {Error}
     */
    resolveOptions(key: any): any;

    /**
     * Determine if the given registration exists.
     * @param  {String}  key
     * @return {Boolean}
     */
    has(key: any): boolean;

    /**
     * Force the container to exit and print the given message and associated error.
     */
    forceExit(message: string, error?: Error): void;

    /**
     * Exit the container with the given exitCode, message and associated error.
     */
    exit(exitCode: number, message: string, error?: Error): void;

    /**
     * Get the application version.
     * @throws {String}
     */
    getVersion(): string;

    /**
     * Set the application version.
     * @param  {String} version
     * @return {void}
     */
    setVersion(version: any): void;
}
