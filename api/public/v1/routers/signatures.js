const controller = requireFrom('api/public/v1/controllers/signatures')

module.exports = (registrar) => {
  registrar.get('signatures/fee', controller.fee)
}
