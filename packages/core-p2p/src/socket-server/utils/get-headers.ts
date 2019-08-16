import { app, Contracts } from "@arkecosystem/core-kernel";

export const getHeaders = () => {
    const headers = {
        version: app.version(),
        port: app.resolve("p2p.options").port,
        height: undefined,
    };

    if (app.has("blockchain")) {
        const lastBlock = app.resolve<Contracts.Blockchain.IBlockchain>("blockchain").getLastBlock();

        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
