import { app } from "@arkecosystem/core-container";
import { Blockchain, EventEmitter, P2P } from "@arkecosystem/core-interfaces";
import { roundCalculator } from "@arkecosystem/core-utils";
import { validate } from "../../../utils/validate";
import * as schema from "../schemas";

export const getUsernames = async () => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const database = blockchain.database;
    const walletManager = database.walletManager;

    const lastBlock = blockchain.getLastBlock();
    const roundInfo = roundCalculator.calculateRound(lastBlock.data.height);

    const delegates = await database.getActiveDelegates(roundInfo);

    const data = {};
    for (const delegate of delegates) {
        data[delegate.publicKey] = walletManager.findByPublicKey(delegate.publicKey).username;
    }

    return { data };
};

export const emitEvent = (service: P2P.IPeerService, req) => {
    validate(schema.emitEvent, req.data); // this will throw if validation failed

    app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").emit(req.data.event, req.data.body);
};
