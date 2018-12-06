import { app } from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";

const config = app.resolvePlugin("config");

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
    const database = app.resolvePlugin("database");
    const blockchain = app.resolvePlugin("blockchain");

    const lastBlock = blockchain.getLastBlock();

    const height = lastBlock.data.height + 1;
    const maxActive = config.getConstants(height).activeDelegates;
    const blockTime = config.getConstants(height).blocktime;
    const reward = config.getConstants(height).reward;
    const delegates = await database.getActiveDelegates(height);
    const timestamp = slots.getTime();

    return {
      data: {
        current: +(height / maxActive),
        reward,
        timestamp,
        delegates,
        currentForger: delegates[+(timestamp / blockTime) % maxActive],
        nextForger:
          delegates[(+(timestamp / blockTime) + 1) % maxActive],
        lastBlock: lastBlock.data,
        canForge:
          +(1 + lastBlock.data.timestamp / blockTime) * blockTime <
          timestamp - 1,
      },
    };
  },
};
