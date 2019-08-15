import { existsSync, removeSync, writeFileSync } from "fs-extra";
import camelCase from "lodash/camelCase";
import { join } from "path";
import * as Bootstrappers from "./bootstrap";
import { ConfigFactory, ConfigRepository } from "./config";
import { Container } from "./container";
import { Blockchain, Kernel, P2P, TransactionPool } from "./contracts";
import { DirectoryNotFound, FailedNetworkDetection } from "./errors";
import { EventDispatcher } from "./event-dispatcher";
import { Logger } from "./logger";
import { ProviderRepository } from "./repositories";
import { AbstractServiceProvider } from "./support";

/**
 * @export
 * @class Application
 * @extends {Container}
 * @implements {Kernel.IApplication}
 */
export class Application extends Container implements Kernel.IApplication {
    /**
     * @private
     * @type {ProviderRepository}
     * @memberof Application
     */
    private readonly providers: ProviderRepository = new ProviderRepository(this);

    /**
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private hasBeenBootstrapped: boolean = false;

    /**
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private booted: boolean = false;

    /**
     * @param {Record<string, any>} config
     * @memberof Application
     */
    public bootstrap(config: Record<string, any>): void {
        this.bindConfiguration(config);

        this.bindPathsInContainer();

        this.registerCoreServices();

        this.registerBindings();

        this.registerNamespace();
    }

    /**
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async boot(): Promise<void> {
        await this.registerServiceProviders();

        this.booted = true;
    }

    /**
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async reboot(): Promise<void> {
        await this.terminate();

        await this.registerServiceProviders();
    }

    /**
     * @returns {Set<AbstractServiceProvider>}
     * @memberof Application
     */
    public getProviders(): Set<AbstractServiceProvider> {
        return this.providers;
    }

    /**
     * @param {AbstractServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async registerProvider(provider: AbstractServiceProvider): Promise<void> {
        await this.providers.register(provider);
    }

    /**
     * @param {AbstractServiceProvider} provider
     * @param {Record<string, any>} opts
     * @returns {AbstractServiceProvider}
     * @memberof Application
     */
    public makeProvider(provider: AbstractServiceProvider, opts: Record<string, any>): AbstractServiceProvider {
        return this.providers.make(provider, opts);
    }

    /**
     * @param {*} listener
     * @returns {*}
     * @memberof Application
     */
    public afterLoadingEnvironment(listener: any): any {
        return this.afterBootstrapping("LoadEnvironmentVariables", listener);
    }

    /**
     * @param {string} bootstrapper
     * @param {*} listener
     * @memberof Application
     */
    public beforeBootstrapping(bootstrapper: string, listener: any): void {
        this.events.listen(`bootstrapping: ${bootstrapper}`, listener);
    }

    /**
     * @param {string} bootstrapper
     * @param {*} listener
     * @memberof Application
     */
    public afterBootstrapping(bootstrapper: string, listener: any): void {
        this.events.listen(`bootstrapped: ${bootstrapper}`, listener);
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} [value]
     * @returns {T}
     * @memberof Application
     */
    public config<T = any>(key: string, value?: T): T {
        if (value) {
            this.resolve("config").set(key, value);
        }

        return this.resolve("config").get(key);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public namespace(): string {
        return this.resolve("app.namespace");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public version(): string {
        return this.resolve("app.version");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public token(): string {
        return this.resolve("app.token");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public network(): string {
        return this.resolve("app.network");
    }

    /**
     * @param {string} value
     * @memberof Application
     */
    public useNetwork(value: string): void {
        this.bind("app.network", value);
    }

    /**
     * @param {string} [path=""]
     * @returns {string}
     * @memberof Application
     */
    public dataPath(path: string = ""): string {
        return join(this.getPath("data"), path);
    }

    /**
     * @param {string} path
     * @memberof Application
     */
    public useDataPath(path: string): void {
        this.usePath("data", path);
    }

    /**
     * @param {string} [path=""]
     * @returns {string}
     * @memberof Application
     */
    public configPath(path: string = ""): string {
        return join(this.getPath("config"), path);
    }

    /**
     * @param {string} path
     * @memberof Application
     */
    public useConfigPath(path: string): void {
        this.usePath("config", path);
    }

    /**
     * @param {string} [path=""]
     * @returns {string}
     * @memberof Application
     */
    public cachePath(path: string = ""): string {
        return join(this.getPath("cache"), path);
    }

    /**
     * @param {string} path
     * @memberof Application
     */
    public useCachePath(path: string): void {
        this.usePath("cache", path);
    }

    /**
     * @param {string} [path=""]
     * @returns {string}
     * @memberof Application
     */
    public logPath(path: string = ""): string {
        return join(this.getPath("log"), path);
    }

    /**
     * @param {string} path
     * @memberof Application
     */
    public useLogPath(path: string): void {
        this.usePath("log", path);
    }

    /**
     * @param {string} [path=""]
     * @returns {string}
     * @memberof Application
     */
    public tempPath(path: string = ""): string {
        return join(this.getPath("temp"), path);
    }

    /**
     * @param {string} path
     * @memberof Application
     */
    public useTempPath(path: string): void {
        this.usePath("temp", path);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public environmentFile(): string {
        return this.configPath(".env");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public environment(): string {
        return this.resolve("app.env");
    }

    /**
     * @param {string} value
     * @memberof Application
     */
    public useEnvironment(value: string): void {
        this.bind("app.env", value);
    }

    /**
     * @returns {boolean}
     * @memberof Application
     */
    public isProduction(): boolean {
        return this.environment() === "production" || this.network() === "mainnet";
    }

    /**
     * @returns {boolean}
     * @memberof Application
     */
    public isDevelopment(): boolean {
        return this.environment() === "development" || ["devnet", "testnet"].includes(this.network());
    }

    /**
     * @returns {boolean}
     * @memberof Application
     */
    public runningTests(): boolean {
        return this.environment() === "test" || this.network() === "testnet";
    }

    /**
     * @returns {boolean}
     * @memberof Application
     */
    public isBooted(): boolean {
        return this.booted;
    }

    /**
     * @returns {boolean}
     * @memberof Application
     */
    public isBootstrapped(): boolean {
        return this.hasBeenBootstrapped;
    }

    /**
     * @memberof Application
     */
    public enableMaintenance(): void {
        writeFileSync(this.tempPath("maintenance"), JSON.stringify({ time: +new Date() }));

        this.log.notice("Application is now in maintenance mode.");

        this.events.dispatch("kernel.maintenance", true);
    }

    /**
     * @memberof Application
     */
    public disableMaintenance(): void {
        removeSync(this.tempPath("maintenance"));

        this.log.notice("Application is now live.");

        this.events.dispatch("kernel.maintenance", false);
    }

    /**
     * @returns {boolean}
     * @memberof Application
     */
    public isDownForMaintenance(): boolean {
        return existsSync(this.tempPath("maintenance"));
    }

    /**
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async terminate(): Promise<void> {
        this.hasBeenBootstrapped = false;

        await this.disposeServiceProviders();
    }

    /**
     * @readonly
     * @type {Kernel.ILogger}
     * @memberof Application
     */
    public get log(): Kernel.ILogger {
        return this.resolve<Kernel.ILogger>("log");
    }

    /**
     * @readonly
     * @type {Blockchain.IBlockchain}
     * @memberof Application
     */
    public get blockchain(): Blockchain.IBlockchain {
        return this.resolve<Blockchain.IBlockchain>("blockchain");
    }

    /**
     * @readonly
     * @type {P2P.IMonitor}
     * @memberof Application
     */
    public get p2p(): P2P.IMonitor {
        return this.resolve<P2P.IMonitor>("p2p");
    }

    /**
     * @readonly
     * @type {TransactionPool.ITransactionPool}
     * @memberof Application
     */
    public get transactionPool(): TransactionPool.ITransactionPool {
        return this.resolve<TransactionPool.ITransactionPool>("transactionPool");
    }

    /**
     * @readonly
     * @type {Kernel.IEventDispatcher}
     * @memberof Application
     */
    public get events(): Kernel.IEventDispatcher {
        return this.resolve<Kernel.IEventDispatcher>("events");
    }

    /**
     * @private
     * @param {Record<string, any>} config
     * @memberof Application
     */
    private bindConfiguration(config: Record<string, any>): void {
        this.bind("configLoader", ConfigFactory.make(this, "local")); // @TODO
        this.bind("config", new ConfigRepository(config));
    }

    /**
     * @private
     * @memberof Application
     */
    private registerBindings(): void {
        this.bind("app.env", this.config("env"));
        this.bind("app.token", this.config("token"));
        this.bind("app.network", this.config("network"));
        this.bind("app.version", this.config("version"));
    }

    /**
     * @private
     * @memberof Application
     */
    private registerNamespace(): void {
        const token = this.token();
        const network = this.network();

        if (!token || !network) {
            throw new FailedNetworkDetection();
        }

        this.bind("app.namespace", `${token}-${network}`);
        this.bind("app.dirPrefix", `${token}/${network}`);
    }

    /**
     * @private
     * @memberof Application
     */
    private registerCoreServices(): void {
        this.bind("events", new EventDispatcher());
        this.bind("log", new Logger(this));
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async registerServiceProviders(): Promise<void> {
        this.hasBeenBootstrapped = true;

        for (const Bootstrapper of Object.values(Bootstrappers)) {
            this.events.dispatch(`bootstrapping: ${Bootstrapper.name}`, this);

            await new Bootstrapper().bootstrap(this);

            this.events.dispatch(`bootstrapped: ${Bootstrapper.name}`, this);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async disposeServiceProviders(): Promise<void> {
        for (const provider of this.getProviders()) {
            await provider.dispose();
        }
    }

    /**
     * @private
     * @memberof Application
     */
    private bindPathsInContainer(): void {
        for (const [type, path] of Object.entries(this.config("paths"))) {
            this[camelCase(`use_${type}_path`)](path);

            this.bind(`path.${type}`, path);
        }
    }

    /**
     * @private
     * @param {string} type
     * @returns {string}
     * @memberof Application
     */
    private getPath(type: string): string {
        const path = this.resolve(`path.${type}`);

        if (!existsSync(path)) {
            throw new DirectoryNotFound(path);
        }

        return path;
    }

    /**
     * @private
     * @param {string} type
     * @param {string} path
     * @memberof Application
     */
    private usePath(type: string, path: string): void {
        if (!existsSync(path)) {
            throw new DirectoryNotFound(path);
        }

        this.bind(`path.${type}`, path);
    }
}
