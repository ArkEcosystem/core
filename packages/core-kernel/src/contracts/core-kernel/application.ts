import { JsonObject } from "type-fest";
import { IBlockchain } from "../core-blockchain";
import { IDatabaseService } from "../core-database";
import { IPeerService } from "../core-p2p";
import { IConnection } from "../core-transaction-pool";
import { IContainer } from "./container";
import { IEventDispatcher } from "./event-dispatcher";
import { IFilesystem } from "./filesystem";
import { ILogger } from "./logger";

export interface IApplication extends IContainer {
    /**
     * Get an instance of the application logger.
     */
    readonly log: ILogger;

    /**
     * Get an instance of the application event dispatcher.
     */
    readonly events: IEventDispatcher;

    /**
     * Get an instance of the application filesystem.
     */
    readonly filesystem: IFilesystem;

    /**
     * Get an instance of the application database.
     */
    readonly database: IDatabaseService;

    /**
     * Get an instance of the application blockchain.
     */
    readonly blockchain: IBlockchain;

    /**
     * Get an instance of the application p2p layer.
     */
    readonly p2p: IPeerService;

    /**
     * Get an instance of the application transaction pool.
     */
    readonly transactionPool: IConnection;

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
}

/**
 * @export
 * @interface IServiceProviderDependency
 */
export interface IServiceProviderDependency {
    /**
     * @type {string}
     * @memberof IServiceProviderDependency
     */
    name: string;

    /**
     * @type {string}
     * @memberof IServiceProviderDependency
     */
    version?: string;

    /**
     * @memberof IServiceProviderDependency
     */
    required?: boolean | (() => Promise<boolean>);
}
