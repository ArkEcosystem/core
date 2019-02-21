import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
// import * as schema from "../schemas/blocks";

export const storeBlock = req => {
    req.data.block.ip = req.headers.remoteAddress;

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").handleIncomingBlock(req.data.block);
    /*
    options: {
        validate: schema.store,
    },
    */
};
