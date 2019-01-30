import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
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
        const database = app.resolve<PostgresConnection>("database");

        const lastBlock = app.blockchain.getLastBlock();

        const height = lastBlock.data.height + 1;
        const maxActive = config.getMilestone(height).activeDelegates;
        const blockTime = config.getMilestone(height).blocktime;
        const reward = config.getMilestone(height).reward;
        const delegates = await database.getActiveDelegates(height);
        const timestamp = slots.getTime();

        const currentForger = parseInt((timestamp / blockTime) as any) % maxActive;
        const nextForger = (parseInt((timestamp / blockTime) as any) + 1) % maxActive;

        return {
            data: {
                current: +(height / maxActive),
                reward,
                timestamp,
                delegates,
                currentForger: delegates[currentForger],
                nextForger: delegates[nextForger],
                lastBlock: lastBlock.data,
                canForge: parseInt((1 + lastBlock.data.timestamp / blockTime) as any) * blockTime < timestamp - 1,
            },
        };
    },
};
