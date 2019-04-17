const {
    Blocks
} = require('@arkecosystem/crypto')

const dataEmpty = require('../helpers').getJSONFixture('block/deserialized/no-transactions');
const dataFull = require('../helpers').getJSONFixture('block/deserialized/transactions');
const serializedEmpty = require('../helpers').getFixture('block/serialized/no-transactions.txt');
const serializedFull = require('../helpers').getFixture('block/serialized/transactions.txt');

exports['fromData (0)'] = () => {
    return Blocks.BlockFactory.fromData(dataEmpty);
};

exports['fromData (150)'] = () => {
    return Blocks.BlockFactory.fromData(dataFull);
};

exports['fromHex (0)'] = () => {
    return Blocks.BlockFactory.fromHex(serializedEmpty);
};

exports['fromHex (150)'] = () => {
    return Blocks.BlockFactory.fromHex(serializedFull);
};
