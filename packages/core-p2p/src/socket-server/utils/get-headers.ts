import { app, Contracts } from "@arkecosystem/core-kernel";

export const getHeaders = () => {
    const headers = {
        version: app.version(),
        port: app.ioc.get<any>("p2p.options").port,
        height: undefined,
    };

    if (app.ioc.isBound("blockchain")) {
        const lastBlock = app.ioc.get<Contracts.Blockchain.IBlockchain>("blockchain").getLastBlock();

        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
