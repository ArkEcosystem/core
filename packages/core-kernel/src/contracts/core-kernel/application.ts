import { AbstractServiceProvider } from "../../support";
import { IBlockchain } from "../core-blockchain";
import { IPeerService } from "../core-p2p";
import { IConnection } from "../core-transaction-pool";
import { IContainer } from "./container";
import { IEventDispatcher } from "./event-dispatcher";
import { ILogger } from "./logger";

export interface IApplication extends IContainer {
    /**
     * Get an instance of the application logger.
     */
    readonly log: ILogger;

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
     * Get an instance of the application event dispatcher.
     */
    readonly events: IEventDispatcher;

    /**
     * Bootstrap the application with the given configuration.
     */
    bootstrap(config: Record<string, any>): void;

    /**
     * Boot the application.
     */
    boot(): void;

    /**
     * Reboot the application.
     */
    reboot(): void;

    /**
     * Get the registered service provider instances if any exist.
     */
    getProviders(): Set<AbstractServiceProvider>;

    /**
     * Register the application service provider.
     */
    registerProvider(provider: AbstractServiceProvider): Promise<void>;

    /**
     * Create a new provider instance.
     */
    makeProvider(provider: AbstractServiceProvider, opts: Record<string, any>): AbstractServiceProvider;

    /**
     * Register a listener to run after loading the environment.
     */
    afterLoadingEnvironment(listener: any): any;

    /**
     * Register a listener to run before a bootstrapper.
     */
    beforeBootstrapping(bootstrapper: string, listener: any): void;

    /**
     * Register a listener to run after a bootstrapper.
     */
    afterBootstrapping(bootstrapper: string, listener: any): void;

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
     * Determine if the application has been bootstrapped.
     */
    isBootstrapped(): boolean;

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
    terminate(): Promise<void>;
}
