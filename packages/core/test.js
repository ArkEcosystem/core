const Ark = require('../client')

const client = new Ark()
client.getConfigManager().setFromPreset('ark', 'mainnet')

console.log(client.getConfigManager().get('pubKeyHash'))
