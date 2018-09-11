const { Block } = require('@arkecosystem/crypto').models

module.exports = new Block(require('../__support__/config/genesisBlock.json'))
