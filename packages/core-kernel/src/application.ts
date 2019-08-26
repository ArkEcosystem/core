import { Constructor } from "awilix";
import { existsSync, removeSync, writeFileSync } from "fs-extra";
import { join } from "path";
import { JsonObject } from "./types";
import * as Bootstrappers from "./bootstrap";
import * as Contracts from "./contracts";
import { DirectoryCannotBeFound } from "./exceptions/filesystem";
import { EventDispatcher } from "./services/events";
import { AbstractServiceProvider, ServiceProviderRepository } from "./providers";
import { EventListener } from "./types/events";
// import { ShutdownSignal } from "./enums/process";
import { IApplication } from "./contracts/kernel";
import { ConfigRepository } from "./services/config";
import { IBootstrapper } from "./bootstrap/interfaces";

/**
 * @export
 * @class Application
 * @extends {Container}
 * @implements {IApplication}
 */
export class Application implements IApplication {
    /**
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private booted = false;

    /**
     * Creates an instance of Application.
     *
     * @param {Contracts.Kernel.Container.Container} container
     * @memberof Application
     */
    public constructor(private readonly container: Contracts.Kernel.Container.Container) {
        // this.listenToShutdownSignals();

        // this.container.bind<IApplication>(Application).toSelf();

        this.container.bind<IApplication>("app").toConstantValue(this);
    }

    /**
     * @param {JsonObject} config
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async bootstrap(config: JsonObject): Promise<void> {
        await this.registerEventDispatcher();

        this.container.bind<JsonObject>("config").toConstantValue(config);

        this.container
            .bind<ServiceProviderRepository>("serviceProviderRepository")
            .to(ServiceProviderRepository)
            .inSingletonScope();

        await this.bootstrapWith("app");

        await this.boot();
    }

    /**
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async boot(): Promise<void> {
        await this.bootstrapWith("serviceProviders");

        this.booted = true;
    }

    /**
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async reboot(): Promise<void> {
        await this.disposeServiceProviders();

        await this.boot();
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} [value]
     * @returns {T}
     * @memberof Application
     */
    public config<T = any>(key: string, value?: T): T {
        const config: ConfigRepository = this.container.get<ConfigRepository>("config");

        if (value) {
            config.set(key, value);
        }

        return config.get(key);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public dirPrefix(): string {
        return this.container.get("app.dirPrefix");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public namespace(): string {
        return this.container.get("app.namespace");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public version(): string {
        return this.container.get("app.version");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public token(): string {
        return this.container.get("app.token");
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public network(): string {
        return this.container.get("app.network");
    }

    /**
     * @param {string} value
     * @memberof Application
     */
    public useNetwork(value: string): void {
        this.container.bind<string>("app.network").toConstantValue(value);
    }

    /**
     * @param {string} [path=""]
     * @returns {string}
     * @memberof Application
     */
    public dataPath(path = ""): string {
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
    public configPath(path = ""): string {
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
    public cachePath(path = ""): string {
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
    public logPath(path = ""): string {
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
    public tempPath(path = ""): string {
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
        return this.container.get("app.env");
    }

    /**
     * @param {string} value
     * @memberof Application
     */
    public useEnvironment(value: string): void {
        this.container.bind<string>("app.env").toConstantValue(value);
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
     * @param {string} [reason]
     * @param {Error} [error]
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async terminate(reason?: string, error?: Error): Promise<void> {
        this.booted = false;

        if (reason) {
            this.log.notice(reason);
        }

        if (error) {
            this.log.notice(error.stack);
        }

        await this.disposeServiceProviders();
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.Kernel.Container.Container}
     * @memberof Application
     */
    public get ioc(): Contracts.Kernel.Container.Container {
        return this.container;
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.Kernel.Log.ILogger}
     * @memberof Application
     */
    public get log(): Contracts.Kernel.Log.ILogger {
        return this.container.get<Contracts.Kernel.Log.ILogger>("log");
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.Kernel.Events.IEventDispatcher}
     * @memberof Application
     */
    public get events(): Contracts.Kernel.Events.IEventDispatcher {
        return this.container.get<Contracts.Kernel.Events.IEventDispatcher>("events");
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.Kernel.Filesystem.IFilesystem}
     * @memberof Application
     */
    public get filesystem(): Contracts.Kernel.Filesystem.IFilesystem {
        return this.container.get<Contracts.Kernel.Filesystem.IFilesystem>("filesystem");
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.Database.IDatabaseService}
     * @memberof Application
     */
    public get database(): Contracts.Database.IDatabaseService {
        return this.container.get<Contracts.Database.IDatabaseService>("database");
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.Blockchain.IBlockchain}
     * @memberof Application
     */
    public get blockchain(): Contracts.Blockchain.IBlockchain {
        return this.container.get<Contracts.Blockchain.IBlockchain>("blockchain");
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.P2P.IPeerService}
     * @memberof Application
     */
    public get p2p(): Contracts.P2P.IPeerService {
        return this.container.get<Contracts.P2P.IPeerService>("p2p");
    }

    /**
     * @todo remove after initial migration
     *
     * @readonly
     * @type {Contracts.TransactionPool.IConnection}
     * @memberof Application
     */
    public get transactionPool(): Contracts.TransactionPool.IConnection {
        return this.container.get<Contracts.TransactionPool.IConnection>("transactionPool");
    }

    /**
     * @template T
     * @param {Contracts.Kernel.Container.ServiceIdentifier<T>} serviceIdentifier
     * @returns {Contracts.Kernel.Container.BindingToSyntax<T>}
     * @memberof Application
     */
    public bind<T>(
        serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>,
    ): Contracts.Kernel.Container.BindingToSyntax<T> {
        return this.container.bind(serviceIdentifier);
    }

    /**
     * @template T
     * @param {Contracts.Kernel.Container.ServiceIdentifier<T>} serviceIdentifier
     * @returns {void}
     * @memberof Application
     */
    public unbind<T>(serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>): void {
        return this.container.unbind(serviceIdentifier);
    }

    /**
     * @template T
     * @param {Contracts.Kernel.Container.ServiceIdentifier<T>} serviceIdentifier
     * @returns {T}
     * @memberof Application
     */
    public get<T>(serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>): T {
        return this.container.get(serviceIdentifier);
    }

    /**
     * @template T
     * @param {Contracts.Kernel.Container.ServiceIdentifier<T>} serviceIdentifier
     * @returns {boolean}
     * @memberof Application
     */
    public isBound<T>(serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>): boolean {
        return this.container.isBound(serviceIdentifier);
    }

    /**
     * @template T
     * @param {Contracts.Kernel.Container.Newable<T>} constructorFunction
     * @returns {T}
     * @memberof Application
     */
    public resolve<T>(constructorFunction: Contracts.Kernel.Container.Newable<T>): T {
        return this.container.resolve(constructorFunction);
    }

    /**
     * Register a listener to run before a bootstrapper.
     *
     * @param {string} bootstrapper
     * @param {EventListener} listener
     * @memberof Application
     */
    public beforeBootstrapping(bootstrapper: string, listener: EventListener) {
        this.events.listen(`bootstrapping:${bootstrapper}`, listener);
    }

    /**
     * Register a listener to run after a bootstrapper.
     *
     * @param {string} bootstrapper
     * @param {EventListener} listener
     * @memberof Application
     */
    public afterBootstrapping(bootstrapper: string, listener: EventListener) {
        this.events.listen(`bootstrapped:${bootstrapper}`, listener);
    }

    /**
     * Run the given type of bootstrap classes.
     *
     * @param {string} type
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async bootstrapWith(type: string): Promise<void> {
        const bootstrappers: Array<Constructor<IBootstrapper>> = Object.values(Bootstrappers[type]);

        for (const bootstrapper of bootstrappers) {
            this.events.dispatch(`bootstrapping:${bootstrapper.name}`, this);

            await this.container.resolve<IBootstrapper>(bootstrapper).bootstrap();

            this.events.dispatch(`bootstrapped:${bootstrapper.name}`, this);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async registerEventDispatcher(): Promise<void> {
        this.container
            .bind<EventDispatcher>("events")
            .to(EventDispatcher)
            .inSingletonScope();
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async disposeServiceProviders(): Promise<void> {
        const serviceProviders: AbstractServiceProvider[] = this.container
            .get<ServiceProviderRepository>("serviceProviderRepository")
            .allLoadedProviders();

        for (const serviceProvider of serviceProviders.reverse()) {
            this.log.debug(`Disposing ${serviceProvider.name()}...`);

            await serviceProvider.dispose();
        }
    }

    /**
     * @private
     * @param {string} type
     * @returns {string}
     * @memberof Application
     */
    private getPath(type: string): string {
        const path: string = this.container.get<string>(`path.${type}`);

        if (!existsSync(path)) {
            throw new DirectoryCannotBeFound(path);
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
            throw new DirectoryCannotBeFound(path);
        }

        const binding = `path.${type}`;

        if (this.container.isBound(binding)) {
            this.container.unbind(binding);
        }

        this.container.bind<string>(binding).toConstantValue(path);
    }

    // /**
    //  * @private
    //  * @memberof Application
    //  */
    // private listenToShutdownSignals(): void {
    //     for (const signal in ShutdownSignal) {
    //         process.on(signal as any, async code => {
    //             await this.terminate(signal);

    //             process.exit(code || 1);
    //         });
    //     }
    // }
}
