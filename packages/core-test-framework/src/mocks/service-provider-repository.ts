import { Providers } from "@arkecosystem/core-kernel";

let mockServiceProviders: Providers.ServiceProvider[] = [];

export const setServiceProviders = (serviceProviders: Providers.ServiceProvider[]) => {
    mockServiceProviders = serviceProviders;
};

class ServiceProviderRepositoryMocks implements Partial<Providers.ServiceProviderRepository> {
    public allLoadedProviders(): Providers.ServiceProvider[] {
        return mockServiceProviders;
    }
}

export const instance = new ServiceProviderRepositoryMocks();
