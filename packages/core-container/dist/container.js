"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const awilix_1 = require("awilix");
const delay_1 = __importDefault(require("delay"));
const log_process_errors_1 = __importDefault(require("log-process-errors"));
const semver_1 = __importDefault(require("semver"));
const config_1 = require("./config");
const environment_1 = require("./environment");
const plugin_1 = require("./registrars/plugin");
class Container {
    constructor() {
        /**
         * May be used by CLI programs to suppress the shutdown messages.
         */
        this.silentShutdown = false;
        this.isReady = false;
        this.container = awilix_1.createContainer();
    }
    /**
     * Set up the app.
     * @param  {String} version
     * @param  {Object} variables
     * @param  {Object} options
     * @return {void}
     */
    async setUp(version, variables, options = {}) {
        // Register any exit signal handling
        this.registerExitHandler(["SIGINT", "exit"]);
        // Set options and variables
        this.options = options;
        this.variables = variables;
        this.setVersion(version);
        this.name = `${this.variables.token}-${this.variables.suffix}`;
        // Register the environment variables
        const environment = new environment_1.Environment(variables);
        environment.setUp();
        if (process.env.CORE_LOG_PROCESS_ERRORS_ENABLED) {
            // just log stuff, don't kill the process on unhandled promises/exceptions
            log_process_errors_1.default({ exitOn: [] });
        }
        // Mainly used for testing environments!
        if (options.skipPlugins) {
            this.isReady = true;
            return;
        }
        // Setup the configuration
        this.config = await config_1.configManager.setUp(variables);
        // TODO: Move this out eventually - not really the responsibility of the container
        this.plugins = new plugin_1.PluginRegistrar(this, options);
        await this.plugins.setUp();
        this.isReady = true;
    }
    getConfig() {
        return this.config;
    }
    async tearDown() {
        if (!this.options.skipPlugins) {
            await this.plugins.tearDown();
        }
        this.isReady = false;
    }
    register(name, resolver) {
        try {
            this.container.register(name, resolver);
            return this;
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
    resolve(key) {
        try {
            return this.container.resolve(key);
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
    resolvePlugin(key) {
        try {
            return this.container.resolve(key).plugin;
        }
        catch (err) {
            return undefined;
        }
    }
    resolveOptions(key) {
        return this.container.resolve(`pkg.${key}.opts`);
    }
    has(key) {
        try {
            this.container.resolve(key);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    forceExit(message, error) {
        this.exit(1, message, error);
    }
    exit(exitCode, message, error) {
        this.shuttingDown = true;
        const logger = this.resolvePlugin("logger");
        logger.error(message);
        if (error) {
            logger.error(error.stack);
        }
        process.exit(exitCode);
    }
    getVersion() {
        return this.version;
    }
    setVersion(version) {
        if (!semver_1.default.valid(version)) {
            this.forceExit(
            // tslint:disable-next-line:max-line-length
            `The provided version ("${version}") is invalid. Please check https://semver.org/ and make sure you follow the spec.`);
        }
        this.version = version;
    }
    getName() {
        return this.name;
    }
    registerExitHandler(exitEvents) {
        const handleExit = async () => {
            if (this.shuttingDown) {
                return;
            }
            this.shuttingDown = true;
            if (this.isReady) {
                const logger = this.resolvePlugin("logger");
                if (logger) {
                    logger.suppressConsoleOutput(this.silentShutdown);
                    logger.info("Core is trying to gracefully shut down to avoid data corruption");
                }
                try {
                    // Notify plugins about shutdown
                    this.resolvePlugin("event-emitter").emit(core_event_emitter_1.ApplicationEvents.ApplicationShutdown);
                    // Wait for event to be emitted and give time to finish
                    await delay_1.default(1000);
                }
                catch (error) {
                    // tslint:disable-next-line:no-console
                    console.error(error.stack);
                }
                await this.plugins.tearDown();
            }
            process.exit();
        };
        // Handle exit events
        for (const eventType of exitEvents) {
            process.on(eventType, handleExit);
        }
    }
}
exports.Container = Container;
//# sourceMappingURL=container.js.map