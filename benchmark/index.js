const { benchmarker } = require('@faustbrian/benchmarker');
const { configManager } = require("@arkecosystem/crypto");

configManager.setFromPreset("mainnet");

benchmarker('core', [
    { name: 'Block.serialize (0 transactions)', scenarios: require('./block/serialize') },
    { name: 'Block.serialize (150 transactions)', scenarios: require('./block/serializeFull') },

    { name: 'Block.deserialize (0 transactions)', scenarios: require('./block/deserialize/0') },
    { name: 'Block.deserialize (150 transactions)', scenarios: require('./block/deserialize/150') },

    { name: 'Transaction.serialize (Type 0)', scenarios: require('./transaction/serialize/0') },
    { name: 'Transaction.deserialize (Type 0)', scenarios: require('./transaction/deserialize/0') },
], { hideSummary: true });
