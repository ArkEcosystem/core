const {
    benchmarker
} = require('@faustbrian/benchmarker');
const {
    Managers
} = require("@arkecosystem/crypto");

Managers.configManager.setFromPreset("mainnet");

benchmarker('core', [{
        name: 'new Block()',
        scenarios: require('./block/create')
    },
    {
        name: 'Block.serialize (0 transactions)',
        scenarios: require('./block/serialize')
    },
    {
        name: 'Block.serialize (150 transactions)',
        scenarios: require('./block/serializeWithTransactions')
    },
    {
        name: 'Block.deserialize (0 transactions)',
        scenarios: require('./block/deserialize/0')
    },
    {
        name: 'Block.deserialize (150 transactions)',
        scenarios: require('./block/deserialize/150')
    },
    {
        name: 'new Transaction (Type 0)',
        scenarios: require('./transaction/create/0')
    },
    {
        name: 'Transaction.serialize (Type 0)',
        scenarios: require('./transaction/serialize/0')
    },
    {
        name: 'Transaction.deserialize (Type 0)',
        scenarios: require('./transaction/deserialize/0')
    },

    {
        name: 'HashAlgorithms',
        scenarios: require('./crypto/hash-algorithms')
    },

], {
    hideSummary: true
});
