const {
    models
} = require('@arkecosystem/crypto')

const dataEmpty = require('../helpers').getJSONFixture('block/deserialized/no-transactions');
const dataFull = require('../helpers').getJSONFixture('block/deserialized/transactions');
const serializedEmpty = require('../helpers').getFixture('block/serialized/no-transactions.txt');
const serializedFull = require('../helpers').getFixture('block/serialized/transactions.txt');

exports['fromData (0)'] = () => {
    return new models.Block(dataEmpty);
};

exports['fromData (150)'] = () => {
    return new models.Block(dataFull);
};

exports['fromHex (0)'] = () => {
    return new models.Block(serializedEmpty);
};

exports['fromHex (150)'] = () => {
    return new models.Block(serializedFull);
};

