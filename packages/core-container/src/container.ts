import { Container as container, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { createContainer, Resolver } from "awilix";
import delay from "delay";
import semver from "semver";
import { configManager } from "./config";
import { Environment } from "./environment";
import { PluginRegistrar } from "./registrars/plugin";

export class Container implements container.IContainer {
    /**
     * May be used by CLI programs to suppress the shutdown messages.
     */
    public silentShutdown = false;
    public options: Record<string, any>;
    public plugins: PluginRegistrar;
    public shuttingDown: boolean;
    public version: string;
    public isReady: boolean = false;
    public variables: Record<string, any>;
    public config: any;

    private name: string;
    private readonly container = createContainer();

    /**
     * Set up the app.
     * @param  {String} version
     * @param  {Object} variables
     * @param  {Object} options
     * @return {void}
     */
    public async setUp(version: string, variables: Record<string, any>, options: Record<string, any> = {}) {
        // Register any exit signal handling
        this.registerExitHandler(["SIGINT", "exit"]);

        // Set options and variables
        this.options = options;
        this.variables = variables;

        this.setVersion(version);

        this.name = `${this.variables.token}-${this.variables.suffix}`;

        // Register the environment variables
        const environment = new Environment(variables);
        environment.setUp();

        // Mainly used for testing environments!
        if (options.skipPlugins) {
            this.isReady = true;
            return;
        }

        // Setup the configuration
        this.config = await configManager.setUp(variables);

        // TODO: Move this out eventually - not really the responsibility of the container
        this.plugins = new PluginRegistrar(this, options);
        await this.plugins.setUp();

        this.isReady = true;
    }

    public getConfig() {
        return this.config;
    }

    /**
     * Tear down the app.
     * @return {Promise}
     */
    public async tearDown() {
        if (!this.options.skipPlugins) {
            await this.plugins.tearDown();
        }

        this.isReady = false;
    }

    /**
     * Add a new registration.
     */
    public register<T>(name: string, resolver: Resolver<T>) {
        try {
            this.container.register(name, resolver);
            return this;
        } catch (err) {
            throw new Error(err.message);
        }
    }

    /**
     * Resolve a registration.
     * @param  {string} key
     * @return {Object}
     * @throws {Error}
     */
    public resolve<T = any>(key: string): T {
        try {
            return this.container.resolve<T>(key);
        } catch (err) {
            throw new Error(err.message);
        }
    }

    /**
     * Resolve a plugin.
     * @param  {string} key
     * @return {Object}
     * @throws {Error}
     */
    public resolvePlugin<T = any>(key: string): T {
        try {
            return this.container.resolve<container.PluginConfig<T>>(key).plugin;
        } catch (err) {
            return null;
        }
    }

    /**
     * Resolve the options of a plugin. Available before a plugin mounts.
     * @param  {string} key
     * @return {Object}
     * @throws {Error}
     */
    public resolveOptions(key) {
        return this.container.resolve<container.PluginConfig<any>>(`pkg.${key}.opts`);
    }

    /**
     * Determine if the given registration exists.
     * @param  {String}  key
     * @return {Boolean}
     */
    public has(key: string) {
        try {
            this.container.resolve(key);

            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Force the container to exit and print the given message and associated error.
     * @param  {String} message
     * @param  {Error} error
     * @return {void}
     */
    public forceExit(message, error = null) {
        this.exit(1, message, error);
    }

    /**
     * Exit the container with the given exitCode, message and associated error.
     * @param  {Number} exitCode
     * @param  {String} message
     * @param  {Error} error
     * @return {void}
     */
    public exit(exitCode, message, error = null) {
        this.shuttingDown = true;

        const logger = this.resolvePlugin<Logger.ILogger>("logger");
        logger.error(message);

        if (error) {
            logger.error(error.stack);
        }

        process.exit(exitCode);
    }

    /**
     * Get the application version.
     * @throws {String}
     */
    public getVersion(): string {
        return this.version;
    }

    /**
     * Set the application version.
     * @param  {String} version
     * @return {void}
     */
    public setVersion(version: string) {
        if (!semver.valid(version)) {
            this.forceExit(
                // tslint:disable-next-line:max-line-length
                `The provided version ("${version}") is invalid. Please check https://semver.org/ and make sure you follow the spec.`,
            );
        }

        this.version = version;
    }

    public getName(): string {
        return this.name;
    }

    /**
     * Handle any exit signals.
     * @return {void}
     */
    private registerExitHandler(exitEvents: string[]) {
        const handleExit = async () => {
            if (this.shuttingDown || !this.isReady) {
                return;
            }

            this.shuttingDown = true;

            const logger = this.resolvePlugin<Logger.ILogger>("logger");
            if (logger) {
                logger.suppressConsoleOutput(this.silentShutdown);
                logger.info("Core is trying to gracefully shut down to avoid data corruption");
            }

            try {
                /* TODO: core-database-postgres has a dep on core-container. Yet we have code in core-container fetching a reference to core-database-postgres.
                If we try to import core-database-postgres types, we create a circular dependency: core-container -> core-database-postgres -> core-container.
                The only thing we're doing here is trying to save the wallets upon shutdown. The code can and should be moved into core-database-postgres instead
                and leverage either the plugins `tearDown` method or the event-emitter's 'shutdown' event
                 */
                const database = this.resolvePlugin("database");
                if (database) {
                    const emitter = this.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

                    // Notify plugins about shutdown
                    emitter.emit("shutdown");

                    // Wait for event to be emitted and give time to finish
                    await delay(1000);
                }
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.error(error.stack);
            }

            await this.plugins.tearDown();

            process.exit();
        };

        // Handle exit events
        exitEvents.forEach(eventType => process.on(eventType as any, handleExit));
    }
}
