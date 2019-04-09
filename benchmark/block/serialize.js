const {
    models
} = require('@arkecosystem/crypto')

const data = require('../helpers').getJSONFixture('block/deserialized/no-transactions');

exports['core'] = () => {
    return blocks.Block.serialize(data);
};
