import { Application } from "../contracts/kernel";
import { EventDispatcher } from "../contracts/kernel/events";
import { KernelEvent } from "../enums";
import { InvalidArgumentException } from "../exceptions/logic";
import { Identifiers, inject, injectable } from "../ioc";
import { assert } from "../utils";
import { ServiceProvider } from "./service-provider";

/**
 * @export
 * @class ServiceProviderRepository
 */
@injectable()
export class ServiceProviderRepository {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof ServiceProviderRepository
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @private
     * @type {EventDispatcher}
     * @memberof ServiceProviderRepository
     */
    @inject(Identifiers.EventDispatcherService)
    private readonly eventDispatcher!: EventDispatcher;

    /**
     * All of the registered service providers.
     *
     * @private
     * @type {Map<string, ServiceProvider>}
     * @memberof ServiceProviderRepository
     */
    private readonly serviceProviders: Map<string, ServiceProvider> = new Map<string, ServiceProvider>();

    /**
     * The names of the loaded service providers.
     *
     * @private
     * @type {Set<string>}
     * @memberof ServiceProviderRepository
     */
    private readonly loadedProviders: Set<string> = new Set<string>();

    /**
     * The names of the failed service providers.
     *
     * @private
     * @type {Map<string, ServiceProvider>}
     * @memberof ServiceProviderRepository
     */
    private readonly failedProviders: Set<string> = new Set<string>();

    /**
     * The names of the deferred service providers.
     *
     * @private
     * @type {Map<string, ServiceProvider>}
     * @memberof ServiceProviderRepository
     */
    private readonly deferredProviders: Set<string> = new Set<string>();

    /**
     * All of the registered service provider aliases.
     *
     * @private
     * @type {Map<string, string>}
     * @memberof ServiceProviderRepository
     */
    private readonly aliases: Map<string, string> = new Map<string, string>();

    /**
     * @returns {Array<[string, ServiceProvider]>}
     * @memberof ServiceProviderRepository
     */
    public all(): Array<[string, ServiceProvider]> {
        return [...this.serviceProviders.entries()];
    }

    /**
     * @returns {ServiceProvider[]}
     * @memberof ServiceProviderRepository
     */
    public allLoadedProviders(): ServiceProvider[] {
        return [...this.loadedProviders.values()].map((name: string) => this.get(name));
    }

    /**
     * @param {string} name
     * @returns {ServiceProvider}
     * @memberof ServiceProviderRepository
     */
    public get(name: string): ServiceProvider {
        const serviceProvider: ServiceProvider | undefined = this.serviceProviders.get(this.aliases.get(name) || name);

        assert.defined<ServiceProvider>(serviceProvider);

        return serviceProvider;
    }

    /**
     * @param {string} name
     * @param {ServiceProvider} provider
     * @memberof ServiceProviderRepository
     */
    public set(name: string, provider: ServiceProvider): void {
        this.serviceProviders.set(name, provider);
    }

    /**
     * @param {string} name
     * @param {string} alias
     * @memberof ServiceProviderRepository
     */
    public alias(name: string, alias: string): void {
        if (this.aliases.has(alias)) {
            throw new InvalidArgumentException(`The alias [${alias}] is already in use.`);
        }

        if (!this.serviceProviders.has(name)) {
            throw new InvalidArgumentException(`The service provider [${name}] is unknown.`);
        }

        this.aliases.set(alias, name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof ServiceProviderRepository
     */
    public has(name: string): boolean {
        return this.serviceProviders.has(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof ServiceProviderRepository
     */
    public loaded(name: string): boolean {
        return this.loadedProviders.has(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof ServiceProviderRepository
     */
    public failed(name: string): boolean {
        return this.failedProviders.has(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof ServiceProviderRepository
     */
    public deferred(name: string): boolean {
        return this.deferredProviders.has(name);
    }

    /**
     * @param {string} name
     * @memberof ServiceProviderRepository
     */
    public load(name: string): void {
        this.loadedProviders.add(name);
    }

    /**
     * @param {string} name
     * @memberof ServiceProviderRepository
     */
    public fail(name: string): void {
        this.failedProviders.add(name);
    }

    /**
     * @param {string} name
     * @memberof ServiceProviderRepository
     */
    public defer(name: string): void {
        this.deferredProviders.add(name);
    }

    /**
     * Register the given provider.
     *
     * @param {ServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ServiceProviderRepository
     */
    public async register(name: string): Promise<void> {
        const serviceProvider = this.get(name);

        this.app
            .bind(Identifiers.PluginConfiguration)
            .toConstantValue(serviceProvider.config())
            .whenTargetTagged("plugin", name);

        await serviceProvider.register();
        await this.eventDispatcher.dispatch(KernelEvent.ServiceProviderRegistered, { name });
    }

    /**
     * Boot the given provider.
     *
     * @param {ServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ServiceProviderRepository
     */
    public async boot(name: string): Promise<void> {
        await this.get(name).boot();

        await this.eventDispatcher.dispatch(KernelEvent.ServiceProviderBooted, { name });

        this.loadedProviders.add(name);
        this.failedProviders.delete(name);
        this.deferredProviders.delete(name);
    }

    /**
     * Dispose the given provider.
     *
     * @param {ServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ServiceProviderRepository
     */
    public async dispose(name: string): Promise<void> {
        await this.get(name).dispose();

        await this.eventDispatcher.dispatch(KernelEvent.ServiceProviderDisposed, { name });

        this.loadedProviders.delete(name);
        this.failedProviders.delete(name);
        this.deferredProviders.add(name);
    }
}
