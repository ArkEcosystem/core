const controller = require('../controllers/blocks')

class BlocksRouter {
  register(registrar) {
    registrar.get('blocks', controller.index)
    registrar.get('blocks/get', controller.show)
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
