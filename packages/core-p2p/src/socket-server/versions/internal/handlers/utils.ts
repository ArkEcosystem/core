import { app } from "@arkecosystem/core-container";
import { Blockchain, EventEmitter } from "@arkecosystem/core-interfaces";

const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

// import * as schema from "../schemas/utils";

export const getUsernames = async () => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const database = blockchain.database;
    const walletManager = database.walletManager;

    const lastBlock = blockchain.getLastBlock();
    const delegates = await database.getActiveDelegates(lastBlock ? lastBlock.data.height + 1 : 1);

    const data = {};
    for (const delegate of delegates) {
        data[delegate.publicKey] = walletManager.findByPublicKey(delegate.publicKey).username;
    }

    return { data };
};

export const emitEvent = req => {
    emitter.emit(req.data.event, req.data.body);
    /*,
    options: {
        validate: schema.emitEvent,
    },
    */
};
