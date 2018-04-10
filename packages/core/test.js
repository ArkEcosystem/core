const Ark = require('@arkecosystem/client').default

const client = new Ark()
client.getConfigManager().setFromPreset('ark', 'mainnet')

console.log(client.getConfigManager().get('pubKeyHash'))
