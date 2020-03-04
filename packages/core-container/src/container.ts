import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Container as container, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { createContainer, Resolver } from "awilix";
import delay from "delay";
import logProcessErrors from "log-process-errors";
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
    public async setUp(
        version: string,
        variables: Record<string, any>,
        options: Record<string, any> = {},
    ): Promise<void> {
        // Register any exit signal handling
        this.registerExitHandler(["SIGINT", "exit"]);

        // Set options and variables
        this.options = options;
        this.variables = variables;

        this.setVersion(version);

        this.name = `${this.variables.token}-${this.variables.suffix}`;

        // Register the environment variables
        const environment: Environment = new Environment(variables);
        environment.setUp();

        if (process.env.CORE_LOG_PROCESS_ERRORS_ENABLED) {
            // just log stuff, don't kill the process on unhandled promises/exceptions
            logProcessErrors({ exitOn: [] });
        }

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

    public async tearDown(): Promise<void> {
        if (!this.options.skipPlugins) {
            await this.plugins.tearDown();
        }

        this.isReady = false;
    }

    public register<T>(name: string, resolver: Resolver<T>) {
        try {
            this.container.register(name, resolver);
            return this;
        } catch (err) {
            throw new Error(err.message);
        }
    }

    public resolve<T = any>(key: string): T {
        try {
            return this.container.resolve<T>(key);
        } catch (err) {
            throw new Error(err.message);
        }
    }

    public resolvePlugin<T = any>(key: string): T {
        try {
            return this.container.resolve<container.IPluginConfig<T>>(key).plugin;
        } catch (err) {
            return undefined;
        }
    }

    public resolveOptions(key) {
        return this.container.resolve<container.IPluginConfig<any>>(`pkg.${key}.opts`);
    }

    public has(key: string) {
        try {
            this.container.resolve(key);

            return true;
        } catch (err) {
            return false;
        }
    }

    public forceExit(message: string, error?: Error) {
        this.exit(1, message, error);
    }

    public exit(exitCode: number, message: string, error?: Error): void {
        this.shuttingDown = true;

        const logger = this.resolvePlugin<Logger.ILogger>("logger");
        logger.error(message);

        if (error) {
            logger.error(error.stack);
        }

        process.exit(exitCode);
    }

    public getVersion(): string {
        return this.version;
    }

    public setVersion(version: string): void {
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

    private registerExitHandler(exitEvents: string[]): void {
        const handleExit = async () => {
            if (this.shuttingDown) {
                return;
            }

            this.shuttingDown = true;

            if (this.isReady) {
                const logger: Logger.ILogger = this.resolvePlugin<Logger.ILogger>("logger");
                if (logger) {
                    logger.suppressConsoleOutput(this.silentShutdown);
                    logger.info("Core is trying to gracefully shut down to avoid data corruption");
                }

                try {
                    // Notify plugins about shutdown
                    this.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").emit(
                        ApplicationEvents.ApplicationShutdown,
                    );

                    // Wait for event to be emitted and give time to finish
                    await delay(1000);
                } catch (error) {
                    // tslint:disable-next-line:no-console
                    console.error(error.stack);
                }

                await this.plugins.tearDown();
            }

            process.exit();
        };

        // Handle exit events
        for (const eventType of exitEvents) {
            process.on(eventType as any, handleExit);
        }
    }
}
