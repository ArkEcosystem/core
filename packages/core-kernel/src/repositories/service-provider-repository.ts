import { AbstractServiceProvider } from "../support";

/**
 * @export
 * @class ServiceProviderRepository
 */
export class ServiceProviderRepository {
    /**
     * All of the registered service providers.
     *
     * @private
     * @type {Map<string, AbstractServiceProvider>}
     * @memberof ServiceProviderRepository
     */
    private readonly serviceProviders: Map<string, AbstractServiceProvider> = new Map<
        string,
        AbstractServiceProvider
    >();

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
     * @type {Map<string, AbstractServiceProvider>}
     * @memberof ServiceProviderRepository
     */
    private readonly failedProviders: Set<string> = new Set<string>();

    /**
     * The names of the deferred service providers.
     *
     * @private
     * @type {Map<string, AbstractServiceProvider>}
     * @memberof ServiceProviderRepository
     */
    private readonly deferredProviders: Set<string> = new Set<string>();

    /**
     * @returns {Array<[string, AbstractServiceProvider]>}
     * @memberof ServiceProviderRepository
     */
    public all(): Array<[string, AbstractServiceProvider]> {
        return Array.from(this.serviceProviders.entries());
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ServiceProviderRepository
     */
    public allServiceProviders(): AbstractServiceProvider[] {
        return Array.from(this.serviceProviders.values());
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ServiceProviderRepository
     */
    public allLoadedProviders(): AbstractServiceProvider[] {
        return Array.from(this.loadedProviders.values()).map((name: string) => this.get(name));
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ServiceProviderRepository
     */
    public allFailedProviders(): AbstractServiceProvider[] {
        return Array.from(this.failedProviders.values()).map((name: string) => this.get(name));
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ServiceProviderRepository
     */
    public allDeferredProviders(): AbstractServiceProvider[] {
        return Array.from(this.deferredProviders.values()).map((name: string) => this.get(name));
    }

    /**
     * @param {string} name
     * @returns {AbstractServiceProvider}
     * @memberof ServiceProviderRepository
     */
    public get(name: string): AbstractServiceProvider {
        return this.serviceProviders.get(name);
    }

    /**
     * @param {string} name
     * @param {AbstractServiceProvider} provider
     * @memberof ServiceProviderRepository
     */
    public set(name: string, provider: AbstractServiceProvider): void {
        this.serviceProviders.set(name, provider);
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
     * @param {AbstractServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ServiceProviderRepository
     */
    public async register(name: string): Promise<void> {
        await this.serviceProviders.get(name).register();
    }

    /**
     * Boot the given provider.
     *
     * @param {AbstractServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ServiceProviderRepository
     */
    public async boot(name: string): Promise<void> {
        await this.serviceProviders.get(name).boot();

        this.loadedProviders.add(name);
        this.failedProviders.delete(name);
        this.deferredProviders.delete(name);
    }

    /**
     * Dispose the given provider.
     *
     * @param {AbstractServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ServiceProviderRepository
     */
    public async dispose(name: string): Promise<void> {
        await this.serviceProviders.get(name).dispose();

        this.loadedProviders.delete(name);
        this.failedProviders.delete(name);
        this.deferredProviders.add(name);
    }
}
