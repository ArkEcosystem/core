import { existsSync, removeSync, writeFileSync } from "fs-extra";
import { join } from "path";
import { JsonObject } from "type-fest";
import { app } from ".";
import * as Bootstrappers from "./bootstrap";
import { AbstractBootstrapper } from "./bootstrap/bootstrapper";
import { Container } from "./container";
import { Kernel } from "./contracts";
import * as Contracts from "./contracts";
import { DirectoryNotFound } from "./errors";
import { ProviderRepository } from "./repositories";

/**
 * @export
 * @class Application
 * @extends {Container}
 * @implements {Kernel.IApplication}
 */
export class Application extends Container implements Kernel.IApplication {
    /**
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private booted: boolean = false;

    /**
     * Creates an instance of Application.
     *
     * @memberof Application
     */
    public constructor() {
        super();

        this.bind<Kernel.IApplication>("app", this);
    }

    /**
     * @param {JsonObject} config
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async bootstrap(config: JsonObject): Promise<void> {
        app.bind<JsonObject>("config", config);

        app.singleton<ProviderRepository>("service-providers", ProviderRepository);

        await this.runBootstrappers("app");

        await this.boot();
    }

    /**
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async boot(): Promise<void> {
        await this.runBootstrappers("serviceProviders");

        this.booted = true;
    }

    /**
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async reboot(): Promise<void> {
        await this.terminate();

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
        if (value) {
            this.resolve("config").set(key, value);
        }

        return this.resolve("config").get(key);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public dirPrefix(): string {
        return this.resolve("app.dirPrefix");
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

        this.log.notice(reason);

        await this.disposeServiceProviders();
    }

    /**
     * @readonly
     * @type {Contracts.Kernel.ILogger}
     * @memberof Application
     */
    public get log(): Contracts.Kernel.ILogger {
        return this.resolve<Contracts.Kernel.ILogger>("log");
    }

    /**
     * @readonly
     * @type {Contracts.Kernel.IEventDispatcher}
     * @memberof Application
     */
    public get events(): Contracts.Kernel.IEventDispatcher {
        return this.resolve<Contracts.Kernel.IEventDispatcher>("event");
    }

    /**
     * @readonly
     * @type {Contracts.Kernel.IFilesystem}
     * @memberof Application
     */
    public get filesystem(): Contracts.Kernel.IFilesystem {
        return this.resolve<Contracts.Kernel.IFilesystem>("filesystem");
    }

    /**
     * @readonly
     * @type {Contracts.Database.IDatabaseService}
     * @memberof Application
     */
    public get database(): Contracts.Database.IDatabaseService {
        return this.resolve<Contracts.Database.IDatabaseService>("database");
    }

    /**
     * @readonly
     * @type {Contracts.Blockchain.IBlockchain}
     * @memberof Application
     */
    public get blockchain(): Contracts.Blockchain.IBlockchain {
        return this.resolve<Contracts.Blockchain.IBlockchain>("blockchain");
    }

    /**
     * @readonly
     * @type {Contracts.P2P.IPeerService}
     * @memberof Application
     */
    public get p2p(): Contracts.P2P.IPeerService {
        return this.resolve<Contracts.P2P.IPeerService>("p2p");
    }

    /**
     * @readonly
     * @type {Contracts.TransactionPool.IConnection}
     * @memberof Application
     */
    public get transactionPool(): Contracts.TransactionPool.IConnection {
        return this.resolve<Contracts.TransactionPool.IConnection>("transaction-pool");
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async runBootstrappers(type: string): Promise<void> {
        const bootstrappers: AbstractBootstrapper[] = Object.values(Bootstrappers[type]);

        for (const Bootstrapper of bootstrappers) {
            // @ts-ignore
            await new Bootstrapper(this).bootstrap();
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async disposeServiceProviders(): Promise<void> {
        for (const provider of app.resolve<ProviderRepository>("service-providers").allLoadedProviders()) {
            await provider.dispose();
        }
    }

    /**
     * @private
     * @param {string} type
     * @returns {string}
     * @memberof Application
     */
    private getPath(type: string): string {
        const path: string = this.resolve<string>(`path.${type}`);

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
