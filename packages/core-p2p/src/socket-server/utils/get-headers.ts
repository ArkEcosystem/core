import { app, Contracts, Container } from "@arkecosystem/core-kernel";

export const getHeaders = () => {
    const headers = {
        version: app.version(),
        port: app.get<any>("p2p.options").port,
        height: undefined,
    };

    if (app.isBound(Container.Identifiers.BlockchainService)) {
        const lastBlock = app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService).getLastBlock();

        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
