import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
// import * as schema from "../schemas/blocks";

export const storeBlock = data => {
    data.block.ip = data.info.remoteAddress;

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").handleIncomingBlock(data.block);
    /*
    options: {
        validate: schema.store,
    },
    */
};
