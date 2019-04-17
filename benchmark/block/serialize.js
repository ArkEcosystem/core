const {
    Blocks
} = require('@arkecosystem/crypto')

const data = require('../helpers').getJSONFixture('block/deserialized/no-transactions');

exports['core'] = () => {
    return Blocks.Block.serialize(data);
};
