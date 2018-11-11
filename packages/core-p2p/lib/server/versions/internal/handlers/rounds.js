const container = require('@arkecosystem/core-container')

const config = container.resolvePlugin('config')

const { slots } = require('@arkecosystem/crypto')

/**
 * @type {Object}
 */
exports.current = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const database = container.resolvePlugin('database')
    const blockchain = container.resolvePlugin('blockchain')

    const lastBlock = blockchain.getLastBlock()

    const height = lastBlock.data.height + 1
    const maxActive = config.getConstants(height).activeDelegates
    const blockTime = config.getConstants(height).blocktime
    const reward = config.getConstants(height).reward
    const delegates = await database.getActiveDelegates(height)
    const timestamp = slots.getTime()

    return {
      data: {
        current: parseInt(height / maxActive),
        reward,
        timestamp,
        delegates,
        currentForger: delegates[parseInt(timestamp / blockTime) % maxActive],
        nextForger:
          delegates[(parseInt(timestamp / blockTime) + 1) % maxActive],
        lastBlock: lastBlock.data,
        canForge:
          parseInt(1 + lastBlock.data.timestamp / blockTime) * blockTime
          < timestamp - 1,
      },
    }
  },
}
