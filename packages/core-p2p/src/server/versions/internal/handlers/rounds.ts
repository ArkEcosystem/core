import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { slots } from "@arkecosystem/crypto";

const config = app.getConfig();

/**
 * @type {Object}
 */
export const current = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        const lastBlock = blockchain.getLastBlock();

        const height = lastBlock.data.height + 1;
        const maxActive = config.getMilestone(height).activeDelegates;
        const blockTime = config.getMilestone(height).blocktime;
        const reward = config.getMilestone(height).reward;
        const delegates = await databaseService.getActiveDelegates(height);
        const timestamp = slots.getTime();
        const blockTimestamp = slots.getSlotNumber(timestamp) * blockTime;
        const currentForger = parseInt((timestamp / blockTime) as any) % maxActive;
        const nextForger = (parseInt((timestamp / blockTime) as any) + 1) % maxActive;

        return {
            data: {
                current: +(height / maxActive),
                reward,
                timestamp: blockTimestamp,
                delegates,
                currentForger: delegates[currentForger],
                nextForger: delegates[nextForger],
                lastBlock: lastBlock.data,
                canForge: parseInt((1 + lastBlock.data.timestamp / blockTime) as any) * blockTime < timestamp - 1,
            },
        };
    },
};
