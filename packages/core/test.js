const { client } = require('@arkecosystem/client')

client.getConfigManager().setFromPreset('ark', 'mainnet')

console.log(client.getConfigManager().get('pubKeyHash'))

process.exit()
