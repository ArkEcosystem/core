import { app, Container, Contracts, Providers } from "@arkecosystem/core-kernel";

export const getHeaders = () => {
    const headers = {
        version: app.version(),
        port: app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("@arkecosystem/core-p2p")
            .config()
            .get<number>("port"),
        height: undefined,
    };

    if (app.isBound(Container.Identifiers.BlockchainService)) {
        const lastBlock = app
            .get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService)
            .getLastBlock();

        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
