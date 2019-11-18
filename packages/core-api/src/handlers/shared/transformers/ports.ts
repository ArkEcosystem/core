import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

export const transformPorts = (app: Contracts.Kernel.Application, config: any) => {
    const result = {};
    const keys = ["@arkecosystem/core-p2p", "@arkecosystem/core-api", "@arkecosystem/core-webhooks"];

    const serviceProviders: Providers.ServiceProvider[] = app
        .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
        .allLoadedProviders();

    for (const serviceProvider of serviceProviders) {
        const name: string = serviceProvider.name()!;
        const options: Record<string, any> = serviceProvider.config().all();

        if (keys.includes(name) && options.enabled) {
            if (options.server && options.server.enabled) {
                result[name] = +options.server.port;

                continue;
            }

            result[name] = +options.port;
        }
    }

    return result;
};
