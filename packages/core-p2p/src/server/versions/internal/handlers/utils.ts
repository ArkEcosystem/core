import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";

const emitter = app.resolvePlugin("event-emitter");

import * as schema from "../schemas/utils";

/**
 * @type {Object}
 */
export const usernames = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const blockchain = app.resolvePlugin("blockchain");
        const database = blockchain.database;
        const walletManager = database.walletManager;

        const lastBlock = blockchain.getLastBlock();
        const delegates = await database.getActiveDelegates(lastBlock ? lastBlock.data.height + 1 : 1);

        const data = {};
        for (const delegate of delegates) {
            data[delegate.publicKey] = walletManager.findByPublicKey(delegate.publicKey).username;
        }

        return { data };
    },
};

/**
 * Emit the given event and payload to the local host.
 * @type {Object}
 */
export const emitEvent = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler: (request, h) => {
        emitter.emit(request.payload.event, request.payload.body);

        return h.response(null).code(204);
    },
    options: {
        validate: schema.emitEvent,
    },
};
