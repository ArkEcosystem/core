import { existsSync, removeSync, writeFileSync } from "fs-extra";
import { join } from "path";

import * as Bootstrappers from "./bootstrap";
import { Bootstrapper } from "./bootstrap/interfaces";
import * as Contracts from "./contracts";
import { KernelEvent } from "./enums";
import { DirectoryCannotBeFound } from "./exceptions/filesystem";
import { Identifiers } from "./ioc";
import { ServiceProvider, ServiceProviderRepository } from "./providers";
// import { ShutdownSignal } from "./enums/process";
import { ConfigRepository } from "./services/config";
import { ServiceProvider as EventServiceProvider } from "./services/events/service-provider";
import { JsonObject, KeyValuePair } from "./types";
import { Constructor } from "./types/container";

/**
 * @export
 * @class Application
 * @extends {Container}
 * @implements {Application}
 */
export class Application implements Contracts.Kernel.Application {
    /**
     * @private
     * @type {boolean}
     * @memberof Application
     */
    private booted: boolean = false;

    /**
     * Creates an instance of Application.
     *
     * @param {Contracts.Kernel.Container.Container} container
     * @memberof Contracts.Kernel.Application
     */
    public constructor(public readonly container: Contracts.Kernel.Container.Container) {
        // todo: enable this after solving the event emitter limit issues
        // this.listenToShutdownSignals();

        this.bind<Contracts.Kernel.Application>(Identifiers.Application).toConstantValue(this);

        this.bind<ConfigRepository>(Identifiers.ConfigRepository).to(ConfigRepository).inSingletonScope();

        this.bind<ServiceProviderRepository>(Identifiers.ServiceProviderRepository)
            .to(ServiceProviderRepository)
            .inSingletonScope();
    }

    /**
     * @param {{ flags: JsonObject; plugins: JsonObject; }} options
     * @returns {Promise<void>}
     * @memberof Application
     */
    public async bootstrap(options: { flags: JsonObject; plugins?: JsonObject }): Promise<void> {
        this.bind<KeyValuePair>(Identifiers.ConfigFlags).toConstantValue(options.flags);
        this.bind<KeyValuePair>(Identifiers.ConfigPlugins).toConstantValue(options.plugins || {});

        await this.registerEventDispatcher();

        await this.bootstrapWith("app");
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
    public config<T = any>(key: string, value?: T): T | undefined {
        const config: ConfigRepository = this.get<ConfigRepository>(Identifiers.ConfigRepository);

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
        return this.get(Identifiers.ApplicationDirPrefix);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public namespace(): string {
        return this.get(Identifiers.ApplicationNamespace);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public version(): string {
        return this.get(Identifiers.ApplicationVersion);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public token(): string {
        return this.get(Identifiers.ApplicationToken);
    }

    /**
     * @returns {string}
     * @memberof Application
     */
    public network(): string {
        return this.get(Identifiers.ApplicationNetwork);
    }

    /**
     * @param {string} value
     * @memberof Application
     */
    public useNetwork(value: string): void {
        this.rebind<string>(Identifiers.ApplicationNetwork).toConstantValue(value);
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
        return this.get(Identifiers.ApplicationEnvironment);
    }

    /**
     * @param {string} value
     * @memberof Application
     */
    public useEnvironment(value: string): void {
        this.rebind<string>(Identifiers.ApplicationEnvironment).toConstantValue(value);
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

        this.get<Contracts.Kernel.Logger>(Identifiers.LogService).notice("Application is now in maintenance mode.");

        this.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService).dispatch(
            "kernel.maintenance",
            true,
        );
    }

    /**
     * @memberof Application
     */
    public disableMaintenance(): void {
        removeSync(this.tempPath("maintenance"));

        this.get<Contracts.Kernel.Logger>(Identifiers.LogService).notice("Application is now live.");

        this.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService).dispatch(
            "kernel.maintenance",
            false,
        );
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
            this.get<Contracts.Kernel.Logger>(Identifiers.LogService).notice(reason);
        }

        if (error) {
            this.get<Contracts.Kernel.Logger>(Identifiers.LogService).error(error.stack);
        }

        await this.disposeServiceProviders();
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
     * @returns {Contracts.Kernel.Container.BindingToSyntax<T>}
     * @memberof Application
     */
    public rebind<T>(
        serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>,
    ): Contracts.Kernel.Container.BindingToSyntax<T> {
        if (this.container.isBound(serviceIdentifier)) {
            this.container.unbind(serviceIdentifier);
        }

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
     * @param {string|number|symbol} key
     * @param {any} value
     * @returns {T}
     * @memberof Application
     */
    public getTagged<T>(
        serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>,
        key: string | number | symbol,
        value: any,
    ): T {
        return this.container.getTagged(serviceIdentifier, key, value);
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
     * Run the given type of bootstrap classes.
     *
     * @param {string} type
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async bootstrapWith(type: string): Promise<void> {
        const bootstrappers: Array<Constructor<Bootstrapper>> = Object.values(Bootstrappers[type]);
        const events: Contracts.Kernel.EventDispatcher = this.get(Identifiers.EventDispatcherService);

        for (const bootstrapper of bootstrappers) {
            events.dispatch(KernelEvent.Bootstrapping, { bootstrapper: bootstrapper.name });

            await this.resolve<Bootstrapper>(bootstrapper).bootstrap();

            events.dispatch(KernelEvent.Bootstrapped, { bootstrapper: bootstrapper.name });
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async registerEventDispatcher(): Promise<void> {
        await this.resolve(EventServiceProvider).register();
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Application
     */
    private async disposeServiceProviders(): Promise<void> {
        const serviceProviders: ServiceProvider[] = this.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        ).allLoadedProviders();

        for (const serviceProvider of serviceProviders.reverse()) {
            this.get<Contracts.Kernel.Logger>(Identifiers.LogService).debug(`Disposing ${serviceProvider.name()}...`);

            try {
                await serviceProvider.dispose();
            } catch {}
        }
    }

    /**
     * @private
     * @param {string} type
     * @returns {string}
     * @memberof Application
     */
    private getPath(type: string): string {
        const path: string = this.get<string>(`path.${type}`);

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

        this.rebind<string>(`path.${type}`).toConstantValue(path);
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
