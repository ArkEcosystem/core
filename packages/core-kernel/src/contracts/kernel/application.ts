import { Exception } from "../../exceptions/base";
import { JsonObject } from "../../types";
import { Container } from "./container";

// todo: remove this interface as it serves no purpose. Every package depends on core-kernel so it can import the application directly.
export interface Application {
    /**
     * Get an instance of the application container.
     */
    readonly container: Container.Container;

    /**
     * Bootstrap the application with the given configuration.
     */
    bootstrap({ flags, plugins }: { flags: JsonObject; plugins?: JsonObject }): Promise<void>;

    /**
     * Boot the application.
     */
    boot(): void;

    /**
     * Reboot the application.
     */
    reboot(): void;

    /**
     * Get or set the specified configuration value.
     */
    config<T = any>(key: string, value?: T): T | undefined;

    /**
     * Get the namespace number of the application.
     */
    namespace(): string;

    /**
     * Get the version number of the application.
     */
    version(): string;

    /**
     * Get the current application token.
     */
    token(): string;

    /**
     * Get the current application network.
     */
    network(): string;

    /**
     * Set the current application network.
     */
    useNetwork(value: string): void;

    /**
     * Get the path to the data directory.
     */
    dataPath(path?: string): string;

    /**
     * Set the data directory.
     */
    useDataPath(path: string): void;

    /**
     * Get the path to the config directory.
     */
    configPath(path?: string): string;

    /**
     * Set the config directory.
     */
    useConfigPath(path: string): void;

    /**
     * Get the path to the cache directory.
     */
    cachePath(path?: string): string;

    /**
     * Set the cache directory.
     */
    useCachePath(path: string): void;

    /**
     * Get the path to the log directory.
     */
    logPath(path?: string): string;

    /**
     * Set the log directory.
     */
    useLogPath(path: string): void;

    /**
     * Get the path to the temp directory.
     */
    tempPath(path?: string): string;

    /**
     * Set the temp directory.
     */
    useTempPath(path: string): void;

    /**
     * Get the environment file the application is using.
     */
    environmentFile(): string;

    /**
     * Get the current application environment.
     */
    environment(): string;

    /**
     * Set the current application environment.
     */
    useEnvironment(value: string): void;

    /**
     * Determine if application is in local environment.
     */
    isProduction(): boolean;

    /**
     * Determine if application is in local environment.
     */
    isDevelopment(): boolean;

    /**
     * Determine if the application is running tests.
     */
    runningTests(): boolean;

    /**
     * Determine if the application has booted.
     */
    isBooted(): boolean;

    /**
     * Put the application into maintenance mode.
     */
    enableMaintenance(): void;

    /**
     * Bring the application out of maintenance mode
     */
    disableMaintenance(): void;

    /**
     * Determine if the application is currently down for maintenance.
     */
    isDownForMaintenance(): boolean;

    /**
     * Terminate the application.
     */
    terminate(reason?: string, error?: Error): Promise<void>;

    bind<T>(serviceIdentifier: Container.ServiceIdentifier<T>): Container.BindingToSyntax<T>;

    rebind<T>(serviceIdentifier: Container.ServiceIdentifier<T>): Container.BindingToSyntax<T>;

    unbind<T>(serviceIdentifier: Container.ServiceIdentifier<T>): void;

    get<T>(serviceIdentifier: Container.ServiceIdentifier<T>): T;

    getTagged<T>(serviceIdentifier: Container.ServiceIdentifier<T>, key: string | number | symbol, value: any): T;

    isBound<T>(serviceIdentifier: Container.ServiceIdentifier<T>): boolean;

    resolve<T>(constructorFunction: Container.Newable<T>): T;
}

/**
 * @export
 * @interface PluginDependency
 */
export interface PluginDependency {
    /**
     * @type {string}
     * @memberof PluginDependency
     */
    name: string;

    /**
     * @type {string}
     * @memberof PluginDependency
     */
    version?: string;

    /**
     * @memberof PluginDependency
     */
    required?: boolean | (() => Promise<boolean>);
}

export interface ExceptionHandler {
    /**
     * Report or log an exception.
     */
    report(exception: Exception);

    /**
     * Determine if the exception should be reported.
     */
    shouldReport(exception: Exception);
}
