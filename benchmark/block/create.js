const {
    models: {
        Block
    }
} = require('@arkecosystem/crypto')

const dataEmpty = require('../helpers').getJSONFixture('block/deserialized/no-transactions');
const dataFull = require('../helpers').getJSONFixture('block/deserialized/transactions');
const serializedEmpty = require('../helpers').getFixture('block/serialized/no-transactions.txt');
const serializedFull = require('../helpers').getFixture('block/serialized/transactions.txt');

exports['fromData (0)'] = () => {
    return Block.fromData(dataEmpty);
};

exports['fromData (150)'] = () => {
    return Block.fromData(dataFull);
};

exports['fromHex (0)'] = () => {
    return Block.fromHex(serializedEmpty);
};

exports['fromHex (150)'] = () => {
    return Block.fromHex(serializedFull);
};
