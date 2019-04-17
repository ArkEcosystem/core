const {
    Blocks
} = require('@arkecosystem/crypto')

const data = require('../helpers').getJSONFixture('block/deserialized/transactions');

exports['core'] = () => {
    return Blocks.Block.serializeWithTransactions(data);
};
