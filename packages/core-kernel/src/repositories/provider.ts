import { AbstractServiceProvider } from "../support";

/**
 * @export
 * @class ProviderRepository
 */
export class ProviderRepository {
    /**
     * All of the registered service providers.
     *
     * @private
     * @type {Map<string, AbstractServiceProvider>}
     * @memberof ProviderRepository
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
     * @memberof ProviderRepository
     */
    private readonly loadedProviders: Set<string> = new Set<string>();

    /**
     * The names of the failed service providers.
     *
     * @private
     * @type {Map<string, AbstractServiceProvider>}
     * @memberof ProviderRepository
     */
    private readonly failedProviders: Set<string> = new Set<string>();

    /**
     * The names of the deferred service providers.
     *
     * @private
     * @type {Map<string, AbstractServiceProvider>}
     * @memberof ProviderRepository
     */
    private readonly deferredProviders: Set<string> = new Set<string>();

    /**
     * @returns {Array<[string, AbstractServiceProvider]>}
     * @memberof ProviderRepository
     */
    public all(): Array<[string, AbstractServiceProvider]> {
        return Array.from(this.serviceProviders.entries());
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ProviderRepository
     */
    public allServiceProviders(): AbstractServiceProvider[] {
        return Array.from(this.serviceProviders.values());
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ProviderRepository
     */
    public allLoadedProviders(): AbstractServiceProvider[] {
        return Array.from(this.loadedProviders.values()).map((name: string) => this.get(name));
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ProviderRepository
     */
    public allFailedProviders(): AbstractServiceProvider[] {
        return Array.from(this.failedProviders.values()).map((name: string) => this.get(name));
    }

    /**
     * @returns {AbstractServiceProvider[]}
     * @memberof ProviderRepository
     */
    public allDeferredProviders(): AbstractServiceProvider[] {
        return Array.from(this.deferredProviders.values()).map((name: string) => this.get(name));
    }

    /**
     * @param {string} name
     * @returns {AbstractServiceProvider}
     * @memberof ProviderRepository
     */
    public get(name: string): AbstractServiceProvider {
        return this.serviceProviders.get(name);
    }

    /**
     *
     * @param {string} name
     * @param {AbstractServiceProvider} provider
     * @memberof ProviderRepository
     */
    public set(name: string, provider: AbstractServiceProvider): void {
        this.serviceProviders.set(name, provider);
    }

    /**
     * Register the given provider.
     *
     * @param {AbstractServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ProviderRepository
     */
    public async register(name: string): Promise<void> {
        await this.serviceProviders.get(name).register();
    }

    /**
     * Boot the given provider.
     *
     * @param {AbstractServiceProvider} provider
     * @returns {Promise<void>}
     * @memberof ProviderRepository
     */
    public async boot(name: string): Promise<void> {
        await this.serviceProviders.get(name).boot();

        this.loadedProviders.add(name);
    }
}
