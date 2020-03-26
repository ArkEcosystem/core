import { Providers } from "@arkecosystem/core-kernel";

let mockServiceProviders: Providers.ServiceProvider[];

export const setServiceProviders = (serviceProviders: Providers.ServiceProvider[]) => {
    mockServiceProviders = serviceProviders;
};

export const instance: Partial<Providers.ServiceProviderRepository> = {
    allLoadedProviders: (): Providers.ServiceProvider[] => {
        return mockServiceProviders;
    },
};
