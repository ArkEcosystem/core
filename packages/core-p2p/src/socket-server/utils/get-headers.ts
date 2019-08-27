import { app, Contracts } from "@arkecosystem/core-kernel";

export const getHeaders = () => {
    const headers = {
        version: app.version(),
        port: app.get<any>("p2p.options").port,
        height: undefined,
    };

    if (app.isBound("blockchain")) {
        const lastBlock = app.get<Contracts.Blockchain.Blockchain>("blockchain").getLastBlock();

        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
