import { JsonObject } from "../../types";
import { Exception } from "../../exceptions/base";
import { Blockchain } from "../blockchain";
import { DatabaseService } from "../database";
import { PeerService } from "../p2p";
import { Connection } from "../transaction-pool";
import { EventDispatcher } from "./events";
import { Filesystem } from "./filesystem";
import { Logger } from "./log";
import { Container } from "./container";

export interface Application {
    /**
     * Get an instance of the application container.
     */
    readonly ioc: Container.Container;

    /**
     * Get an instance of the application logger.
     */
    readonly log: Logger;

    /**
     * Get an instance of the application event dispatcher.
     */
    readonly events: EventDispatcher;

    /**
     * Get an instance of the application filesystem.
     */
    readonly filesystem: Filesystem;

    /**
     * Get an instance of the application database.
     */
    readonly database: DatabaseService;

    /**
     * Get an instance of the application blockchain.
     */
    readonly blockchain: Blockchain;

    /**
     * Get an instance of the application p2p layer.
     */
    readonly p2p: PeerService;

    /**
     * Get an instance of the application transaction pool.
     */
    readonly transactionPool: Connection;

    /**
     * Bootstrap the application with the given configuration.
     */
    bootstrap(config: JsonObject): Promise<void>;

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
    config<T = any>(key: string, value?: T): T;

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

    unbind<T>(serviceIdentifier: Container.ServiceIdentifier<T>): void;

    get<T>(serviceIdentifier: Container.ServiceIdentifier<T>): T;

    isBound<T>(serviceIdentifier: Container.ServiceIdentifier<T>): boolean;

    resolve<T>(constructorFunction: Container.Newable<T>): T;
}

/**
 * @export
 * @interface PackageDependency
 */
export interface PackageDependency {
    /**
     * @type {string}
     * @memberof PackageDependency
     */
    name: string;

    /**
     * @type {string}
     * @memberof PackageDependency
     */
    version?: string;

    /**
     * @memberof PackageDependency
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
