const controller = requireFrom('api/public/v1/controllers/blocks')
const schema = requireFrom('api/public/v1/schemas/blocks')

class BlocksRouter {
  register(registrar) {
    registrar.get('blocks', controller.index, schema.getBlocks)
    registrar.get('blocks/get', controller.show, schema.getBlock)
    registrar.get('blocks/getEpoch', controller.epoch)
    registrar.get('blocks/getHeight', controller.height)
    registrar.get('blocks/getNethash', controller.nethash)
    registrar.get('blocks/getFee', controller.fee)
    registrar.get('blocks/getFees', controller.fees)
    registrar.get('blocks/getMilestone', controller.milestone)
    registrar.get('blocks/getReward', controller.reward)
    registrar.get('blocks/getSupply', controller.supply)
    registrar.get('blocks/getStatus', controller.status)
  }
}

module.exports = new BlocksRouter()
